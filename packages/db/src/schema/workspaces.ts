import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Supabase auth user UUID — stored directly, no FK to avoid cross-table type mismatch
  owner_id: text("owner_id").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
