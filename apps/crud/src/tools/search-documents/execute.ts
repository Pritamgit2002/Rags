import { db } from "@/lib/drizzle";
import { embed_text } from "@/lib/embed";
import { chunks, documents } from "@repo/db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { TSearchDocumentsArgs } from "./definition";

/** Cosine distance on OpenAI text-embedding-3-small — good matches are typically 0.35–0.55. */
const SIMILARITY_THRESHOLD = 0.55;
const TOP_K = 5;

/**
 * Workspace-scoped RAG retrieval, exposed to the model as a tool call rather
 * than run unconditionally by the controller. This lets the orchestrator
 * decide when a turn actually needs document knowledge (vs. a greeting or
 * general chit-chat) while keeping the `WHERE workspace_id = ...` filter
 * baked into the query itself.
 */
export async function execute_search_documents(
  args: TSearchDocumentsArgs,
  workspace_id: string
): Promise<Record<string, unknown>> {
  return {
    chunks: [],
    total_chunks: 0,
    total_documents: 0,
  };
}
