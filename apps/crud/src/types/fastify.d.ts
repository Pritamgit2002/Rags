import type { users } from "@repo/db";
import "fastify";

export type TSupabaseUser = {
  id: string;
  email: string;
  name: string;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: typeof users.$inferSelect;
    supabase_user?: TSupabaseUser;
  }
}
