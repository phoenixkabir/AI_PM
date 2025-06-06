CREATE TABLE "feedback_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"analysis" jsonb NOT NULL,
	"analysis_type" varchar(100) DEFAULT 'general' NOT NULL,
	"llm_model" varchar(100),
	"processing_time" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"message_id" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "status" SET DEFAULT 'initiated'::text;--> statement-breakpoint
DROP TYPE "public"."feedback_status";--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('initiated', 'dropped', 'completed');--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "status" SET DEFAULT 'initiated'::"public"."feedback_status";--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "status" SET DATA TYPE "public"."feedback_status" USING "status"::"public"."feedback_status";--> statement-breakpoint
ALTER TABLE "generated_conversations" ALTER COLUMN "expires_at" SET DEFAULT '2025-06-07 19:20:04.778';--> statement-breakpoint
ALTER TABLE "product_conversations" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 19:20:04.777';--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 19:20:04.778';--> statement-breakpoint
ALTER TABLE "feedback_analysis" ADD CONSTRAINT "feedback_analysis_feedback_id_user_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."user_feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_feedback_id_user_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."user_feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" DROP COLUMN "room_finished_received";