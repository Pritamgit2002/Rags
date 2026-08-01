import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const insertItemSchema = createInsertSchema(items, {
  name: z.string().min(1),
  description: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectItemSchema = createSelectSchema(items);

export const updateItemSchema = insertItemSchema.partial();
