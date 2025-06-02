import { geminiModel } from "@/lib/gemini";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { z } from "zod";
import { db } from "@/db";
import { GeneratedConversations } from "@/db/schema";

const promptSchema = z.object({
  userPrompt: z.string().min(10, "Prompt must be at least 10 characters"),
});

const generationInstruction = `
You are given a user prompt describing a product and possibly a feature or concern.
1. Convert it into a system-level prompt suitable for an AI feedback agent.
2. Extract a slug by combining product and feature name if possible.
3. Generate 3 to 5 short feedback questions.
4. ALWAYS MAKE SURE THAT YOU GENERATE QUESTIONS IN HINGLISH (COMBINATION OF ENGLISH AND HINDI MIXED TOGETHER IN A SENTENCE). DONT GENERATE TEXT ONCE IN HINGLISH AND THEN AGAIN IN ENGLISH. JUST TEXT IN HINGLISH IS ENOUGH.
5. MAKE SURE THAT THE QUESTIONS ARE NOT REPEATED. THEY SHOULD BE UNIQUE.
6. MAKE SURE THAT THE QUESTIONS ALSO TRY TO CAPTURE THE USERS EMOTIONS AND THOUGHTS ABOUT THE PRODUCT.
7. MAKE SURE THAT YOU GENERATE QUESTIONS THAT ARE USEFUL FOR THE PRODUCT TEAM TO IMPROVE THE PRODUCT.

Respond only in JSON format like this:
{
  "slug": "product-feature",
  "systemPrompt": "A system-level prompt here...",
  "questions": ["Question 1", "Question 2", ...]
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPrompt } = body;

    const parsed = promptSchema.safeParse({ userPrompt });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const input = `${generationInstruction}\n\nUser Prompt: ${parsed.data.userPrompt}\n\n`;

    const result = await geminiModel.generateContent(input);
    let text = result.response.text();

    text = text.trim();
    if (text.startsWith("```json")) {
      text = text
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("Failed to parse Gemini response:", text, err);
      return NextResponse.json(
        { error: "Gemini API did not return valid JSON", raw: text },
        { status: 502 }
      );
    }

    data.slug = slugify(data.slug || "", { lower: true, strict: true }) + `-${nanoid(5)}`;

    // Save the generated data to the database
    await db.insert(GeneratedConversations).values({
      slug: data.slug,
      systemPrompt: data.systemPrompt,
      questions: data.questions,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating conversation data:", error);
    return NextResponse.json({ error: "Failed to generate data" }, { status: 500 });
  }
}
