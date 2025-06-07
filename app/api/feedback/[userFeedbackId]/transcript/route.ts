import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { UserFeedback, TranscriptEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: { userFeedbackId: string } }) {
  try {
    const userFeedbackId = params.userFeedbackId;
    const transcriptData = await request.json();

    console.log(`📥 Received transcript update for UserFeedback ID ${userFeedbackId}`);
    console.log(`📝 Raw transcript data:`, transcriptData);
    console.log(`📊 Data type:`, Array.isArray(transcriptData) ? 'Array' : typeof transcriptData);
    console.log(`📏 Array length:`, Array.isArray(transcriptData) ? transcriptData.length : 'N/A');

    // Handle both array of transcript entries and individual entries
    if (Array.isArray(transcriptData)) {
      console.log(`🔄 Processing ${transcriptData.length} transcript entries...`);
      
      // Log sample of entries for debugging
      transcriptData.slice(0, 3).forEach((entry, idx) => {
        console.log(`  Entry ${idx + 1}:`, {
          id: entry.id,
          role: entry.role,
          text: entry.text?.substring(0, 50) + '...',
          content: entry.content?.substring(0, 50) + '...',
          hasText: !!entry.text,
          hasContent: !!entry.content
        });
      });
      
      // If it's an array, store each entry in TranscriptEntries table
      for (const entry of transcriptData) {
        if (entry.text || entry.content) {
          const insertedEntry = await db.insert(TranscriptEntries).values({
            feedbackId: userFeedbackId,
            role: entry.role || 'unknown',
            content: entry.text || entry.content,
            messageId: entry.id || '',
            metadata: { 
              startTime: entry.startTime,
              endTime: entry.endTime,
              language: entry.language,
              final: entry.final,
              firstReceivedTime: entry.firstReceivedTime
            }
          }).returning({ id: TranscriptEntries.id });
          
          console.log(`✅ Inserted transcript entry:`, insertedEntry[0]?.id);
        } else {
          console.log(`⚠️ Skipping entry with no text/content:`, entry);
        }
      }
      
      // Also update the main transcript field for backward compatibility
      await db.update(UserFeedback)
        .set({ transcript: transcriptData })
        .where(eq(UserFeedback.id, userFeedbackId));
      
      console.log(`✅ Updated UserFeedback record with ${transcriptData.length} transcript entries`);
        
    } else if (transcriptData.text || transcriptData.content) {
      console.log(`🔄 Processing single transcript entry...`);
      // If it's a single entry, store it
      const insertedEntry = await db.insert(TranscriptEntries).values({
        feedbackId: userFeedbackId,
        role: transcriptData.role || 'unknown',
        content: transcriptData.text || transcriptData.content,
        messageId: transcriptData.id || '',
        metadata: { 
          startTime: transcriptData.startTime,
          endTime: transcriptData.endTime,
          language: transcriptData.language,
          final: transcriptData.final,
          firstReceivedTime: transcriptData.firstReceivedTime
        }
      }).returning({ id: TranscriptEntries.id });
      
      console.log(`✅ Inserted single transcript entry:`, insertedEntry[0]?.id);
    } else {
      console.log(`⚠️ Fallback: updating main transcript field`);
      // Fallback: update the main transcript field
      await db.update(UserFeedback)
        .set({ transcript: transcriptData })
        .where(eq(UserFeedback.id, userFeedbackId));
    }

    const updatedFeedback = await db.query.UserFeedback.findFirst({
      where: eq(UserFeedback.id, userFeedbackId),
      columns: { id: true }
    });

    if (!updatedFeedback) {
      console.error(`❌ UserFeedback record not found for ID: ${userFeedbackId}`);
      return NextResponse.json({ success: false, error: 'UserFeedback record not found' }, { status: 404 });
    }

    console.log(`✅ Transcript successfully updated for UserFeedback ID ${userFeedbackId}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing transcript update:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 