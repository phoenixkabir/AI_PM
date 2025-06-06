import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { UserFeedback, TranscriptEntries, FeedbackAnalysis } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// Ensure API key and secret are defined
if (!apiKey || !apiSecret) {
  throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be defined in .env.local');
}

const receiver = new WebhookReceiver(apiKey, apiSecret);

export async function POST(request: NextRequest) {
  try {
    // LiveKit sends the raw body, not JSON, for signature verification
    const rawBody = await request.text();
    const authorization = request.headers.get('Authorization');

    if (!authorization) {
      return NextResponse.json({ success: false, error: 'No Authorization header' }, { status: 401 });
    }

    const event = await receiver.receive(rawBody, authorization);

    // Log the event for now to see what's coming in
    console.log('Received LiveKit webhook event:', event);

    // Handle track published and unpublished events for transcript capture
    if (event.event === 'track_published' || event.event === 'track_unpublished') {
      // For now, we'll capture transcripts via the existing transcript route
      // This is a placeholder for future real-time transcript capture
      console.log(`Track event: ${event.event} in room ${event.room?.sid}`);
    }

    if (event.event === 'room_finished') {
      console.log(`Room ${event.room?.name} (${event.room?.sid}) finished.`);

      const roomSid = event.room?.sid;
      if (!roomSid) {
        console.error('Missing room SID in room_finished event');
        return NextResponse.json({ success: false, error: 'Missing event data' }, { status: 400 });
      }

      // Find the UserFeedback record by roomSid in metadata
      const feedbackRecord = await db.query.UserFeedback.findFirst({
          where: sql`${UserFeedback.metadata}->>'roomSid' = ${roomSid}`,
          columns: { id: true, transcript: true, conversationId: true, status: true }
      });

      // Check if this conversation has already been processed or is currently being processed (prevent duplicates)
      if (feedbackRecord && (feedbackRecord.status === 'completed' || feedbackRecord.status === 'processing')) {
        console.log(`Room ${roomSid} already processed or being processed (status: ${feedbackRecord.status}). Skipping duplicate processing.`);
        return NextResponse.json({ success: true, message: 'Already processed or processing' }, { status: 200 });
      }

      if (!feedbackRecord) {
          console.warn(`UserFeedback record not found for roomSid: ${roomSid}`);
          
          // Fallback 1: Try to find the most recent UserFeedback record with transcript data but without roomSid
          console.log('Fallback 1: searching for recent UserFeedback records with transcript data...');
          
          const recentFeedbackWithTranscript = await db.query.UserFeedback.findMany({
            where: sql`${UserFeedback.createdAt} > NOW() - INTERVAL '1 hour' 
                      AND ${UserFeedback.status} = 'initiated' 
                      AND (${UserFeedback.metadata}->>'roomSid' IS NULL OR ${UserFeedback.metadata}->>'roomSid' = '')`,
            columns: { id: true, transcript: true, conversationId: true, createdAt: true, metadata: true },
            orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
            limit: 10
          });

          console.log(`Found ${recentFeedbackWithTranscript.length} recent feedback records to check`);
          
          // Check each recent record for transcript data
          for (const record of recentFeedbackWithTranscript) {
            const transcriptEntries = await db.query.TranscriptEntries.findMany({
              where: eq(TranscriptEntries.feedbackId, record.id),
              limit: 1
            });
            
            const existingTranscript = record.transcript;
            const existingTranscriptArray = Array.isArray(existingTranscript) ? existingTranscript : [];
            
            if (transcriptEntries.length > 0 || existingTranscriptArray.length > 0) {
              console.log(`Found transcript data in feedback record ${record.id}, processing with LLM...`);
              await processTranscriptWithLLM(record.id, transcriptEntries, existingTranscriptArray);
              
              // Associate this record with the roomSid for future reference
              await db.update(UserFeedback)
                .set({
                  metadata: sql`COALESCE(${UserFeedback.metadata}, '{}') || ${JSON.stringify({ roomSid: roomSid })}`
                })
                .where(eq(UserFeedback.id, record.id));
                
              console.log(`Associated feedback record ${record.id} with roomSid ${roomSid}`);
              return NextResponse.json({ success: true }, { status: 200 });
            }
          }
          
          // Fallback 2: Look for any recent transcript entries that might be orphaned
          console.log('Fallback 2: searching for orphaned transcript entries...');
          const recentTranscriptEntries = await db.query.TranscriptEntries.findMany({
            where: sql`${TranscriptEntries.createdAt} > NOW() - INTERVAL '30 minutes'`,
            orderBy: (entries, { desc }) => [desc(entries.createdAt)],
            limit: 20
          });
          
          if (recentTranscriptEntries.length > 0) {
            console.log(`Found ${recentTranscriptEntries.length} recent transcript entries, processing most recent conversation...`);
            
            // Group by feedbackId and process the most recent complete conversation
            const feedbackGroups = recentTranscriptEntries.reduce((groups, entry) => {
              if (!groups[entry.feedbackId]) {
                groups[entry.feedbackId] = [];
              }
              groups[entry.feedbackId].push(entry);
              return groups;
            }, {} as Record<string, typeof recentTranscriptEntries>);
            
            // Process the largest group (most complete conversation)
            const largestGroup = Object.entries(feedbackGroups)
              .sort(([,a], [,b]) => b.length - a.length)[0];
            
            if (largestGroup) {
              const [orphanedFeedbackId, entries] = largestGroup;
              console.log(`Processing orphaned conversation with ${entries.length} entries for feedback ${orphanedFeedbackId}`);
              await processTranscriptWithLLM(orphanedFeedbackId, entries, []);
              
              // Associate this orphaned conversation with the roomSid
              await db.update(UserFeedback)
                .set({
                  metadata: sql`COALESCE(${UserFeedback.metadata}, '{}') || ${JSON.stringify({ roomSid: roomSid })}`
                })
                .where(eq(UserFeedback.id, orphanedFeedbackId));
                
              console.log(`Associated orphaned feedback record ${orphanedFeedbackId} with roomSid ${roomSid}`);
              return NextResponse.json({ success: true }, { status: 200 });
            }
          }
          
          console.warn(`No transcript data found for roomSid: ${roomSid} after all fallback attempts`);
          return NextResponse.json({ success: true, message: 'No transcript data found' }, { status: 200 });
      } else {
          console.log(`Found UserFeedback record ${feedbackRecord.id} for roomSid ${roomSid}.`);
          
          // Atomically mark as processing to prevent race conditions - only if currently "initiated"
          const claimResult = await db.update(UserFeedback)
            .set({ status: 'processing' })
            .where(sql`${UserFeedback.id} = ${feedbackRecord.id} AND ${UserFeedback.status} = 'initiated'`)
            .returning({ id: UserFeedback.id });
          
          if (claimResult.length === 0) {
            console.log(`Failed to claim processing for feedback ${feedbackRecord.id} - likely already being processed by another webhook`);
            return NextResponse.json({ success: true, message: 'Already being processed' }, { status: 200 });
          }
          
          console.log(`Successfully claimed processing for feedback ${feedbackRecord.id}`);
          
          // Get all transcript entries for this feedback
          const transcriptEntries = await db.query.TranscriptEntries.findMany({
            where: eq(TranscriptEntries.feedbackId, feedbackRecord.id),
            orderBy: (entries, { asc }) => [asc(entries.timestamp)]
          });

          // Also check the existing transcript field as fallback
          const existingTranscript = feedbackRecord.transcript;
          const existingTranscriptArray = Array.isArray(existingTranscript) ? existingTranscript : [];

          if (transcriptEntries.length > 0 || existingTranscriptArray.length > 0) {
              console.log(`Processing transcript for feedback record ${feedbackRecord.id}... (${transcriptEntries.length} new entries, ${existingTranscriptArray.length} existing entries)`);
              
              // Process with LLM
              await processTranscriptWithLLM(feedbackRecord.id, transcriptEntries, existingTranscriptArray);

              console.log(`Finished processing transcript for feedback record ${feedbackRecord.id}.`);
              return NextResponse.json({ success: true }, { status: 200 });
          } else {
              console.log(`No transcript data found for feedback record ${feedbackRecord.id}. This might be an early room_finished event.`);
              
              // Reset status back to initiated since no processing was done
              await db.update(UserFeedback)
                .set({ status: 'initiated' })
                .where(eq(UserFeedback.id, feedbackRecord.id));
              
              // Check if there might be transcript data that hasn't been associated yet
              console.log('Checking for unassociated transcript data...');
              
              // Look for recent transcript entries that might belong to this conversation
              const recentTranscriptEntries = await db.query.TranscriptEntries.findMany({
                where: sql`${TranscriptEntries.createdAt} > NOW() - INTERVAL '15 minutes'`,
                orderBy: (entries, { desc }) => [desc(entries.createdAt)],
                limit: 10
              });
              
              if (recentTranscriptEntries.length > 0) {
                // Check if any of these transcript entries are for feedback records without roomSid
                for (const entry of recentTranscriptEntries) {
                  const entryFeedback = await db.query.UserFeedback.findFirst({
                    where: eq(UserFeedback.id, entry.feedbackId),
                    columns: { id: true, metadata: true, status: true }
                  });
                  
                  if (entryFeedback && entryFeedback.status !== 'completed' && (!entryFeedback.metadata || !(entryFeedback.metadata as any)?.roomSid)) {
                    console.log(`Found transcript entry from feedback ${entry.feedbackId} without roomSid, checking if it should be associated with ${roomSid}`);
                    
                    // Get all entries for this feedbackId to see if it's a substantial conversation
                    const allEntriesForFeedback = await db.query.TranscriptEntries.findMany({
                      where: eq(TranscriptEntries.feedbackId, entry.feedbackId)
                    });
                    
                    if (allEntriesForFeedback.length >= 2) { // At least 2 messages indicate a real conversation
                      console.log(`Associating transcript data from feedback ${entry.feedbackId} with roomSid ${roomSid} and processing...`);
                      
                      // Mark the orphaned feedback as processing
                      await db.update(UserFeedback)
                        .set({ 
                          status: 'processing',
                          metadata: sql`COALESCE(${UserFeedback.metadata}, '{}') || ${JSON.stringify({ roomSid: roomSid })}`
                        })
                        .where(eq(UserFeedback.id, entry.feedbackId));
                      
                      // Process this conversation
                      await processTranscriptWithLLM(entry.feedbackId, allEntriesForFeedback, []);
                      
                      console.log(`Successfully processed unassociated transcript data for roomSid ${roomSid}`);
                      return NextResponse.json({ success: true }, { status: 200 });
                    }
                  }
                }
              }
              
              console.log(`No usable transcript data found for roomSid ${roomSid}`);
              return NextResponse.json({ success: true, message: 'No transcript data available yet' }, { status: 200 });
          }
      }    } else if (event.event === 'participant_joined') {
        console.log(`Participant ${event.participant?.identity} joined room ${event.room?.name} (${event.room?.sid}).`);
        
        const roomSid = event.room?.sid;
        const participantIdentity = event.participant?.identity;

        if (!roomSid || !participantIdentity) {
            console.error('Missing room SID or participant identity in participant_joined event');
            return NextResponse.json({ success: false, error: 'Missing event data' }, { status: 400 });
        }

        // Find the MOST RECENT UserFeedback record by participantIdentity in metadata and update with roomSid
        // This addresses the issue where multiple records exist for the same participant
        const feedbackRecord = await db.query.UserFeedback.findFirst({
            where: sql`${UserFeedback.metadata}->>'participantIdentity' = ${participantIdentity} AND ${UserFeedback.status} = 'initiated'`,
            columns: { id: true, metadata: true, createdAt: true },
            orderBy: (feedback, { desc }) => [desc(feedback.createdAt)]
        });

        if (feedbackRecord) {
            const updatedFeedback = await db.update(UserFeedback)
                .set({
                    metadata: sql`${UserFeedback.metadata} \|\| ${JSON.stringify({ roomSid: roomSid })}`
                })
                .where(eq(UserFeedback.id, feedbackRecord.id))
                .returning({ id: UserFeedback.id });

            if (updatedFeedback.length > 0) {
                console.log(`UserFeedback record ${updatedFeedback[0].id} updated with room SID ${roomSid}.`);
            }
        } else {
            console.warn(`UserFeedback record not found for participantIdentity: ${participantIdentity}`);
            // It's possible a feedback record wasn't created for this participant (e.g., agent joining)
            // We can still return success 200 in this case.
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing LiveKit webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to process transcript with LLM
async function processTranscriptWithLLM(
  feedbackId: string, 
  transcriptEntries: any[], 
  existingTranscriptArray: any[]
) {
  try {
    let formattedTranscript = '';
    
    // Use transcript entries if available, otherwise fall back to existing transcript
    if (transcriptEntries.length > 0) {
      formattedTranscript = transcriptEntries.map(entry => 
        `${entry.role}: ${entry.content}`
      ).join("\n");
    } else if (existingTranscriptArray.length > 0) {
      formattedTranscript = existingTranscriptArray.map((entry: any) => 
        `${entry.role}: ${entry.text || entry.content}`
      ).join("\n");
    }
    
    if (!formattedTranscript) {
      console.warn(`No transcript content to process for feedback ID: ${feedbackId}`);
      // Reset status back to initiated since no processing was actually done
      await db.update(UserFeedback)
        .set({ status: 'initiated' })
        .where(eq(UserFeedback.id, feedbackId));
      return;
    }
    
    console.log(`Starting LLM analysis for feedback ${feedbackId}...`);
    const startTime = Date.now();
    
    // Call LLM analysis API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/llm/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transcript: formattedTranscript,
        feedbackId 
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`LLM processing completed for feedback ID: ${feedbackId} in ${processingTime}ms`);
      
      // Update the UserFeedback status to completed
      await db.update(UserFeedback)
        .set({ status: 'completed' })
        .where(eq(UserFeedback.id, feedbackId));
    } else {
      const errorText = await response.text();
      console.error(`LLM processing failed for feedback ID: ${feedbackId}`, errorText);
      
      // Reset status back to initiated on failure so it can be retried
      await db.update(UserFeedback)
        .set({ status: 'initiated' })
        .where(eq(UserFeedback.id, feedbackId));
        
      throw new Error(`LLM API failed: ${errorText}`);
    }
  } catch (error) {
    console.error("Error in LLM processing:", error);
    
    // Reset status back to initiated on any error so it can be retried
    try {
      await db.update(UserFeedback)
        .set({ status: 'initiated' })
        .where(eq(UserFeedback.id, feedbackId));
    } catch (dbError) {
      console.error("Failed to reset status after LLM processing error:", dbError);
    }
    
    throw error; // Re-throw to let caller handle it
  }
}

// Helper function to recover raw messages if needed (placeholder for future implementation)
async function fetchRawMessagesFromLiveKit(roomSid: string) {
  // Implementation depends on your LiveKit setup
  // This could query LiveKit's history API or your own message storage
  
  // Placeholder implementation - you would implement this based on your LiveKit setup
  console.log(`Attempting to recover messages for room: ${roomSid}`);
  return [];
}

