import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ProductConversations, UserFeedback, FeedbackAnalysis } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const agentName = params.name;
    
    if (!agentName) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    // First, find the conversation for this agent
    const conversation = await db.query.ProductConversations.findFirst({
      where: eq(ProductConversations.uniqueName, agentName),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: `No agent found with name: ${agentName}` },
        { status: 404 }
      );
    }

    // Get all feedback for this conversation
    const allFeedback = await db.select().from(UserFeedback)
      .where(eq(UserFeedback.conversationId, conversation.id))
      .orderBy(desc(UserFeedback.createdAt));

    // For each feedback, get its analysis if it exists
    const enhancedFeedback = await Promise.all(
      allFeedback.map(async (feedback) => {
        const analysis = await db.select().from(FeedbackAnalysis)
          .where(eq(FeedbackAnalysis.feedbackId, feedback.id))
          .limit(1);

        return {
          ...feedback,
          conversationName: conversation.uniqueName,
          agentName: agentName,
          analysis: analysis[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        agentName,
        conversationId: conversation.id,
        totalConversations: enhancedFeedback.length,
        conversations: enhancedFeedback,
      },
    });
  } catch (error) {
    console.error("Error fetching agent conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
