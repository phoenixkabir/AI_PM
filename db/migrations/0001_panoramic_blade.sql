ALTER TYPE "public"."feedback_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "generated_conversations" ALTER COLUMN "expires_at" SET DEFAULT '2025-06-07 13:52:51.319';--> statement-breakpoint
ALTER TABLE "product_conversations" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 13:52:51.318';--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "updated_at" SET DEFAULT '2025-06-06 13:52:51.319';