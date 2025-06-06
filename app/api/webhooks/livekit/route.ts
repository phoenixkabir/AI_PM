import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { UserFeedback } from "@/db/schema";
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
          columns: { id: true, transcript: true, conversationId: true }
      });

      if (!feedbackRecord) {
          console.warn(`UserFeedback record not found for roomSid: ${roomSid}`);
          // This could happen if the participant_joined event was missed or record wasn't created.
          // Still return success as the webhook was received.
      } else {
          console.log(`Found UserFeedback record ${feedbackRecord.id} for roomSid ${roomSid}.`);
          const transcript = feedbackRecord.transcript;
          // Ensure transcript is treated as an array
          const transcriptArray = Array.isArray(transcript) ? transcript : [];

          if (transcriptArray.length > 0) {
              console.log(`Processing transcript for feedback record ${feedbackRecord.id}...`);

              // TODO: Send the transcriptArray to the LLM (Groq/Gemini) for inference
              // const llmResponse = await callLLM(transcriptArray, feedbackRecord.conversationId);

              // TODO: Save the LLM's inferences/summary back to the UserFeedback record
              // await db.update(UserFeedback)
              //   .set({ feedbackSummary: llmResponse.summary, status: 'completed' })
              //   .where(eq(UserFeedback.id, feedbackRecord.id));

              console.log(`Finished processing (placeholder) for feedback record ${feedbackRecord.id}.`);
          } else {
              console.log(`No transcript data found for feedback record ${feedbackRecord.id}. Skipping LLM processing.`);
          }
      }

    } else if (event.event === 'participant_joined') {
        console.log(`Participant ${event.participant?.identity} joined room ${event.room?.name} (${event.room?.sid}).`);

        const roomSid = event.room?.sid;
        const participantIdentity = event.participant?.identity;

        if (!roomSid || !participantIdentity) {
            console.error('Missing room SID or participant identity in participant_joined event');
            return NextResponse.json({ success: false, error: 'Missing event data' }, { status: 400 });
        }

        // Find the UserFeedback record by participantIdentity in metadata and update with roomSid
        const updatedFeedback = await db.update(UserFeedback)
            .set({
                metadata: sql`${UserFeedback.metadata} \|\| ${JSON.stringify({ roomSid: roomSid })}`
            })
            .where(sql`${UserFeedback.metadata}->>'participantIdentity' = ${participantIdentity}`)
            .returning({ id: UserFeedback.id });

        if (!updatedFeedback || updatedFeedback.length === 0) {
            console.warn(`UserFeedback record not found for participantIdentity: ${participantIdentity}`);
            // It's possible a feedback record wasn't created for this participant (e.g., agent joining)
            // We can still return success 200 in this case.
        } else {
            console.log(`UserFeedback record ${updatedFeedback[0].id} updated with room SID ${roomSid}.`);
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing LiveKit webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 