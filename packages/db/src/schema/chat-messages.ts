import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const chat_messages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspace_id: uuid("workspace_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  // [{doc_id, filename, chunk_index}]
  citations: jsonb("citations"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type ChatMessage = typeof chat_messages.$inferSelect;
export type NewChatMessage = typeof chat_messages.$inferInsert;
