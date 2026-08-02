ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "owner_id" SET DATA TYPE text;