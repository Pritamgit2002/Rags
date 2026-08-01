import type { users } from "@repo/db";
import "fastify";

export type TSupabaseUser = {
  supabase_uid: string;
  email: string;
  name: string;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: typeof users.$inferSelect;
    supabase_user?: TSupabaseUser;
  }
}
