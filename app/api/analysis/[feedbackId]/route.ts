import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { FeedbackAnalysis, UserFeedback, TranscriptEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  try {
    const { feedbackId } = params;

    if (!feedbackId) {
      return NextResponse.json({ error: 'Missing feedback ID' }, { status: 400 });
    }

    // Get the user feedback record
    const feedback = await db.query.UserFeedback.findFirst({
      where: eq(UserFeedback.id, feedbackId),
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 });
    }

    // Get the analysis results
    const analysis = await db.query.FeedbackAnalysis.findFirst({
      where: eq(FeedbackAnalysis.feedbackId, feedbackId),
      orderBy: [desc(FeedbackAnalysis.createdAt)]
    });

    // Get transcript entries
    const transcriptEntries = await db.query.TranscriptEntries.findMany({
      where: eq(TranscriptEntries.feedbackId, feedbackId),
      orderBy: [desc(TranscriptEntries.timestamp)]
    });

    return NextResponse.json({
      success: true,
      data: {
        feedback,
        analysis: analysis?.analysis || null,
        analysisMetadata: analysis ? {
          llmModel: analysis.llmModel,
          processingTime: analysis.processingTime,
          createdAt: analysis.createdAt
        } : null,
        transcriptEntries,
        hasTranscript: transcriptEntries.length > 0 || (Array.isArray(feedback.transcript) && feedback.transcript.length > 0)
      }
    });

  } catch (error) {
    console.error("Error fetching analysis results:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch analysis results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
