import { db } from "@/db";
import { UserFeedback } from "@/db/schema";
import { geminiModel } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { conversationId } = parsed.data;

    const feedback = await db
      .select()
      .from(UserFeedback)
      .where(eq(UserFeedback.conversationId, conversationId));

    if (!feedback || !feedback[0].transcript) {
      return NextResponse.json(
        { error: "Transcript not found for this conversation ID" },
        { status: 404 }
      );
    }

    const prompt = `
            You are a product research assistant. Summarize the following transcript into a human-readable and constructive feedback summary.

            Focus on:
            - Pain points
            - Suggestions for improvement
            - Positive feedback
            - Usability insights

            Transcript:
            """
            ${feedback[0].transcript}
            """

            Summary:
            `;

    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text().trim();

    await db
      .update(UserFeedback)
      .set({ feedbackSummary: summary })
      .where(eq(UserFeedback.id, feedback[0].id));

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error("Error summarizing feedback:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
