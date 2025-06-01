import dayjs from "dayjs";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const ProductConversations = pgTable("product_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  uniqueName: varchar("unique_name", { length: 255 }).notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  questions: text("questions").array().notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => dayjs().toDate())
    .default(dayjs().toDate()),
});

export const feedbackStatusEnum = pgEnum("feedback_status", ["initiated", "dropped", "completed"]);

export const UserFeedback = pgTable("user_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),

  conversationId: uuid("conversation_id")
    .references(() => ProductConversations.id, { onDelete: "cascade" })
    .notNull(),

  feedbackSummary: text("feedback_summary"),

  transcript: jsonb("transcript").notNull().default([]),
  // Structure: [{ role: 'user', content: '...' }, { role: 'ai', content: '...' }]

  userData: jsonb("user_data"),
  // Example: { name: "Visakha", occupation: "girlfriend", location: "aditya's heart" }

  status: feedbackStatusEnum("status").notNull().default("initiated"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => dayjs().toDate())
    .default(dayjs().toDate()),
});
