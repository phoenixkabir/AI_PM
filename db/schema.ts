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

// Table to store temporarily generated conversation data
export const GeneratedConversations = pgTable("generated_conversations", {
  slug: varchar("slug", { length: 255 }).notNull().primaryKey(),
  systemPrompt: text("system_prompt").notNull(),
  questions: text("questions").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Auto-expire after 24 hours
  expiresAt: timestamp("expires_at").notNull().default(dayjs().add(24, 'hour').toDate()),
});

export const feedbackStatusEnum = pgEnum("feedback_status", ["initiated", "processing", "dropped", "completed"]);

export const UserFeedback = pgTable("user_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),

  conversationId: uuid("conversation_id")
    .references(() => ProductConversations.id, { onDelete: "cascade" })
    .notNull(),

  feedbackSummary: text("feedback_summary"),

  transcript: jsonb("transcript").notNull().default([]),
  // Structure: [{ role: 'user', content: '...' }, { role: 'ai', content: '...' }]

  userData: jsonb("user_data"),
  // Example: { name: "Vishakha", occupation: "girlfriend", location: "aditya's heart" }

  status: feedbackStatusEnum("status").notNull().default("initiated"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => dayjs().toDate())
    .default(dayjs().toDate()),
});

// Table to store individual transcript entries for better tracking
export const TranscriptEntries = pgTable("transcript_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  feedbackId: uuid("feedback_id")
    .references(() => UserFeedback.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).notNull(), // "user", "assistant", "system"
  content: text("content").notNull(),
  messageId: varchar("message_id", { length: 255 }), // For tracking specific messages
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional message metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table to store LLM analysis results
export const FeedbackAnalysis = pgTable("feedback_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  feedbackId: uuid("feedback_id")
    .references(() => UserFeedback.id, { onDelete: "cascade" })
    .notNull(),
  analysis: jsonb("analysis").notNull(), // LLM analysis results
  analysisType: varchar("analysis_type", { length: 100 }).notNull().default("general"), // "sentiment", "summary", "insights", etc.
  llmModel: varchar("llm_model", { length: 100 }), // Track which model was used
  processingTime: timestamp("processing_time").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
