'use server'

import { db } from "@/db";
import { ProductConversations } from "@/db/schema";
import { desc } from "drizzle-orm";

export interface ProductConversation {
  id: string;
  uniqueName: string;
  systemPrompt: string;
  questions: string[];
  createdAt: string;
}

export async function getProductConversations(): Promise<ProductConversation[]> {
  const conversations = await db
    .select({
      id: ProductConversations.id,
      uniqueName: ProductConversations.uniqueName,
      systemPrompt: ProductConversations.systemPrompt,
      questions: ProductConversations.questions,
      createdAt: ProductConversations.createdAt
    })
    .from(ProductConversations)
    .orderBy(desc(ProductConversations.createdAt))
    .limit(10);

  return conversations as unknown as ProductConversation[];
} 