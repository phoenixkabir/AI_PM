import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { UserFeedback, TranscriptEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: { userFeedbackId: string } }) {
  try {
    const userFeedbackId = params.userFeedbackId;
    const transcriptData = await request.json();

    console.log(`Received transcript update for UserFeedback ID ${userFeedbackId}:`, transcriptData);

    // Handle both array of transcript entries and individual entries
    if (Array.isArray(transcriptData)) {
      // If it's an array, store each entry in TranscriptEntries table
      for (const entry of transcriptData) {
        if (entry.text || entry.content) {
          await db.insert(TranscriptEntries).values({
            feedbackId: userFeedbackId,
            role: entry.role || 'unknown',
            content: entry.text || entry.content,
            messageId: entry.id || '',
            metadata: { 
              startTime: entry.startTime,
              endTime: entry.endTime,
              language: entry.language,
              final: entry.final
            }
          });
        }
      }
      
      // Also update the main transcript field for backward compatibility
      await db.update(UserFeedback)
        .set({ transcript: transcriptData })
        .where(eq(UserFeedback.id, userFeedbackId));
        
    } else if (transcriptData.text || transcriptData.content) {
      // If it's a single entry, store it
      await db.insert(TranscriptEntries).values({
        feedbackId: userFeedbackId,
        role: transcriptData.role || 'unknown',
        content: transcriptData.text || transcriptData.content,
        messageId: transcriptData.id || '',
        metadata: { 
          startTime: transcriptData.startTime,
          endTime: transcriptData.endTime,
          language: transcriptData.language,
          final: transcriptData.final
        }
      });
    } else {
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
      // This might happen if the userFeedbackId is not valid
      return NextResponse.json({ success: false, error: 'UserFeedback record not found' }, { status: 404 });
    }

    console.log(`Transcript updated for UserFeedback ID ${userFeedbackId}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing transcript update:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 