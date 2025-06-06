ALTER TYPE "public"."feedback_status" ADD VALUE 'processing' BEFORE 'dropped';--> statement-breakpoint
ALTER TABLE "generated_conversations" ALTER COLUMN "expires_at" SET DEFAULT '2025-06-07 19:58:01.634';--> statement-breakpoint
ALTER TABLE "product_conversations" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 19:58:01.633';--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 19:58:01.634';