import { db } from "@/lib/drizzle";
import { embed_text } from "@/lib/embed";
import { chunks, documents } from "@repo/db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { TSearchDocumentsArgs } from "./definition";

/** Cosine distance: 0 = identical, 2 = opposite. Matches ≤ this value are kept. */
const SIMILARITY_THRESHOLD = 0.55;
const TOP_K = 5;

/**
 * Filler / intent words that tell the model *how* to answer but carry no
 * domain content. Stripped before building the keyword ilike filters so a
 * query like "briefly explain RAG ingestion" still finds chunks about
 * "RAG ingestion" rather than matching the word "briefly".
 */
const INTENT_WORDS = new Set([
  "explain",
  "brief",
  "briefly",
  "summarize",
  "summarise",
  "describe",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "tell",
  "give",
  "show",
  "list",
  "find",
  "search",
  "look",
  "about",
  "note",
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "shall",
  "should",
  "may",
  "might",
  "must",
  "can",
  "could",
  "me",
  "my",
  "i",
  "we",
  "our",
  "you",
  "your",
  "it",
  "its",
  "they",
  "their",
  "please",
  "need",
  "want",
  "get",
  "make",
  "write",
  "create",
  "generate",
  "provide",
  "some",
  "any",
  "all",
  "this",
  "that",
  "these",
  "those",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "from",
  "by",
  "up",
  "out",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "and",
  "or",
  "but",
  "if",
  "so",
]);

type TChunkRow = {
  content: string;
  chunk_index: number;
  document_id: string;
  filename: string;
  distance: number;
};

function extract_keywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !INTENT_WORDS.has(w));
}

/**
 * Workspace-scoped RAG retrieval, exposed to the model as a tool call rather
 * than run unconditionally by the controller. This lets the orchestrator
 * decide when a turn actually needs document knowledge (vs. a greeting or
 * general chit-chat) while keeping the `WHERE workspace_id = ...` filter
 * baked into the query itself.
 *
 * Flow:
 *  1. Embed the query and run a cosine-distance vector search (top-K).
 *  2. Filter results to those within SIMILARITY_THRESHOLD.
 *  3. Extract content keywords from the query (strips intent words) and run
 *     a supplemental ilike keyword search — this handles queries like
 *     "explain X" or "write a brief note on Y" where the intent words would
 *     otherwise dilute the vector signal.
 *  4. Merge both result sets (deduped by document_id + chunk_index).
 *  5. Return { found: false } when nothing matches so the model replies
 *     "I don't know" instead of hallucinating.
 */
export async function execute_search_documents(
  args: TSearchDocumentsArgs,
  workspace_id: string
): Promise<Record<string, unknown>> {
  const query_embedding = await embed_text(args.query);
  // Build the vector literal using the same [v1,v2,...] format pgvector expects.
  const vec_literal = sql.raw(`'[${query_embedding.join(",")}]'::vector(768)`);

  // ── Step 1: vector search (cosine distance, top-K) ──────────────────────
  const vector_rows: TChunkRow[] = await db
    .select({
      content: chunks.content,
      chunk_index: chunks.chunk_index,
      document_id: chunks.document_id,
      filename: documents.filename,
      distance: sql<number>`(${chunks.embedding} <=> ${vec_literal})`,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.document_id, documents.id))
    .where(eq(chunks.workspace_id, workspace_id))
    .orderBy(sql`(${chunks.embedding} <=> ${vec_literal})`)
    .limit(TOP_K);

  // ── Step 2: apply similarity threshold ──────────────────────────────────
  const above_threshold = vector_rows.filter(
    (r) => r.distance <= SIMILARITY_THRESHOLD
  );

  // ── Step 3: keyword search supplement ───────────────────────────────────
  // Runs in parallel only when meaningful keywords exist after stripping intent words.
  const keywords = extract_keywords(args.query);
  let keyword_rows: TChunkRow[] = [];

  if (keywords.length > 0) {
    const keyword_conditions = keywords.map((kw) =>
      ilike(chunks.content, `%${kw}%`)
    );
    keyword_rows = await db
      .select({
        content: chunks.content,
        chunk_index: chunks.chunk_index,
        document_id: chunks.document_id,
        filename: documents.filename,
        distance: sql<number>`(${chunks.embedding} <=> ${vec_literal})`,
      })
      .from(chunks)
      .innerJoin(documents, eq(chunks.document_id, documents.id))
      .where(
        and(eq(chunks.workspace_id, workspace_id), or(...keyword_conditions))
      )
      .orderBy(sql`(${chunks.embedding} <=> ${vec_literal})`)
      .limit(TOP_K);
  }

  // ── Step 4: merge & deduplicate ──────────────────────────────────────────
  const seen = new Set(
    above_threshold.map((r) => `${r.document_id}:${r.chunk_index}`)
  );
  const merged: TChunkRow[] = [...above_threshold];

  for (const kr of keyword_rows) {
    const key = `${kr.document_id}:${kr.chunk_index}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(kr);
    }
  }

  // ── Step 5: fallback ────────────────────────────────────────────────────
  if (merged.length === 0) {
    return { found: false, reason: "No Data found" };
  }

  const unique_documents = new Set(merged.map((r) => r.filename));

  return {
    found: true,
    chunks: merged.map((r) => ({
      content: r.content,
      filename: r.filename,
      chunk_index: r.chunk_index,
      document_id: r.document_id,
    })),
    total_chunks: merged.length,
    total_documents: unique_documents.size,
  };
}
