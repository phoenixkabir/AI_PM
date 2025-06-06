import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { FeedbackAnalysis, UserFeedback } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { limit = 20 } = await request.json();

    const recentFeedback = await db.query.UserFeedback.findMany({
      orderBy: [desc(UserFeedback.createdAt)],
      limit: limit,
    });

    // For each feedback, check if analysis exists
    const feedbackWithAnalysis = await Promise.all(
      recentFeedback.map(async (feedback) => {
        const analysis = await db.query.FeedbackAnalysis.findFirst({
          where: eq(FeedbackAnalysis.feedbackId, feedback.id),
          orderBy: [desc(FeedbackAnalysis.createdAt)]
        });

        return {
          id: feedback.id,
          createdAt: feedback.createdAt,
          status: feedback.status,
          feedbackSummary: feedback.feedbackSummary,
          metadata: feedback.metadata,
          hasAnalysis: !!analysis,
          analysisPreview: analysis?.analysis ? {
            summary: (analysis.analysis as any).summary?.substring(0, 150) + '...',
            sentiment: (analysis.analysis as any).sentiment,
            status: feedback.status
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: feedbackWithAnalysis
    });

  } catch (error) {
    console.error("Error fetching recent feedback:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch recent feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
