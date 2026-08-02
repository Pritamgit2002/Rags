ALTER TABLE "users" DROP CONSTRAINT "users_supabase_uid_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "mime_type" text DEFAULT 'application/octet-stream' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "size" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_url" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "mime_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "size" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "supabase_uid";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";