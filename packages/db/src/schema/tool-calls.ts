import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tool_calls = pgTable("tool_calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspace_id: uuid("workspace_id").notNull(),
  tool_name: text("tool_name").notNull(),
  arguments: jsonb("arguments").notNull(),
  result: jsonb("result"),
  status: text("status").notNull(), // 'success' | 'error'
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type ToolCall = typeof tool_calls.$inferSelect;
export type NewToolCall = typeof tool_calls.$inferInsert;
