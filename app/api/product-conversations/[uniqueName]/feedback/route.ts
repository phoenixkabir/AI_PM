import { db } from "@/db";
import { ProductConversations, UserFeedback } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const allowedStatuses = ["initiated", "dropped", "completed"] as const;
type FeedbackStatus = (typeof allowedStatuses)[number];

export async function GET(req: NextRequest, { params }: { params: { uniqueName: string } }) {
  try {
    const { uniqueName } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (status && !allowedStatuses.includes(status as FeedbackStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const conversation = await db
      .select()
      .from(ProductConversations)
      .where(eq(ProductConversations.uniqueName, uniqueName))
      .limit(1)
      .then((rows) => rows[0]);

    if (!conversation) {
      return NextResponse.json({ error: "ProductConversation not found" }, { status: 404 });
    }

    const whereConditions = [eq(UserFeedback.conversationId, conversation.id)];
    if (status) {
      whereConditions.push(eq(UserFeedback.status, status as FeedbackStatus));
    }

    const feedbacks = await db
      .select()
      .from(UserFeedback)
      .where(and(...whereConditions));

    return NextResponse.json({ data: feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: "Failed to fetch user feedback" }, { status: 500 });
  }
}
