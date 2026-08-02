import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    storage_url: text("storage_url").notNull(),
    mime_type: text("mime_type").notNull(),
    size: text("size").notNull(),
    // sha256 of raw file bytes — checked before re-ingesting to ensure idempotency
    content_hash: text("content_hash").notNull(),
    status: text("status").notNull().default("processing"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("documents_workspace_hash_unique").on(
      t.workspace_id,
      t.content_hash
    ),
  ]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
