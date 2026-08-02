import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspace_id: uuid("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  done: boolean("done").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
