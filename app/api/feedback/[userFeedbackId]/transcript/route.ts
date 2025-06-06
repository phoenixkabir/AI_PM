import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { UserFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: { userFeedbackId: string } }) {
  try {
    const userFeedbackId = params.userFeedbackId;
    const transcriptData = await request.json();

    console.log(`Received transcript update for UserFeedback ID ${userFeedbackId}:`, transcriptData);

    // Find the UserFeedback record and update its transcript
    const updatedFeedback = await db.update(UserFeedback)
      .set({ transcript: transcriptData })
      .where(eq(UserFeedback.id, userFeedbackId))
      .returning({ id: UserFeedback.id });

    if (!updatedFeedback || updatedFeedback.length === 0) {
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