// app/api/product-conversations/route.ts
import { db } from "@/db";
import { ProductConversations } from "@/db/schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    const sort = searchParams.get("sort"); // 'latest' | 'oldest'
    const orderBy = sort === "oldest" ? "asc" : "desc";

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const whereConditions = [];

    if (from) {
      whereConditions.push(gte(ProductConversations.createdAt, new Date(from)));
    }
    if (to) {
      whereConditions.push(lte(ProductConversations.createdAt, new Date(to)));
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(ProductConversations)
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    const conversations = await db
      .select()
      .from(ProductConversations)
      .where(whereConditions.length ? and(...whereConditions) : undefined)
      .orderBy(
        orderBy === "asc"
          ? asc(ProductConversations.createdAt)
          : desc(ProductConversations.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: conversations,
      meta: {
        page,
        perPage: limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const conversationSchema = z.object({
  uniqueName: z.string().min(1),
  systemPrompt: z.string().min(1),
  questions: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = conversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { uniqueName, systemPrompt, questions } = parsed.data;

    const existing = await db
      .select()
      .from(ProductConversations)
      .where(eq(ProductConversations.uniqueName, uniqueName))
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) {
      return NextResponse.json(
        { error: "A ProductConversation with this uniqueName already exists" },
        { status: 409 }
      );
    }

    const newConversation = await db
      .insert(ProductConversations)
      .values({
        uniqueName,
        systemPrompt,
        questions,
      })
      .returning();

    return NextResponse.json({ data: newConversation[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating ProductConversation:", error);
    return NextResponse.json({ error: "Failed to create ProductConversation" }, { status: 500 });
  }
}
