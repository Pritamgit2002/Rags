import {
  customType,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

// pgvector column — serialises number[] ↔ Postgres vector(768)
const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(val: number[]): string {
    return `[${val.join(",")}]`;
  },
  fromDriver(val: string): number[] {
    if (typeof val === "string") {
      return val
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(Number);
    }
    return val as unknown as number[];
  },
});

export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  document_id: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  // workspace_id is denormalised here so every retrieval query can filter
  // directly on this column without needing a join.
  workspace_id: uuid("workspace_id").notNull(),
  chunk_index: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: vector768("embedding"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
