import { db } from "@/lib/drizzle";
import { embed_text } from "@/lib/embed";
import { chunks, documents } from "@repo/db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { TSearchDocumentsArgs } from "./definition";

/** Cosine distance on OpenAI text-embedding-3-small — good matches are typically 0.35–0.55. */
const SIMILARITY_THRESHOLD = 0.55;
const TOP_K = 5;

const STOPWORDS = new Set([
  "about",
  "doc",
  "docs",
  "document",
  "documents",
  "from",
  "tell",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "the",
  "this",
  "that",
  "with",
  "your",
  "have",
  "does",
  "into",
]);

export type TSearchDocumentsChunk = {
  content: string;
  filename: string;
  chunk_index: number;
  document_id: string;
};

function extract_search_terms(query: string): string[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !STOPWORDS.has(term));

  return [...new Set(terms)];
}

async function keyword_search(
  workspace_id: string,
  terms: string[]
): Promise<TSearchDocumentsChunk[]> {
  if (terms.length === 0) return [];

  const keyword_clauses = terms.map((term) =>
    ilike(chunks.content, `%${term}%`)
  );

  const results = await db
    .select({
      content: chunks.content,
      chunk_index: chunks.chunk_index,
      document_id: chunks.document_id,
      filename: documents.filename,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.document_id, documents.id))
    .where(and(eq(chunks.workspace_id, workspace_id), or(...keyword_clauses)))
    .limit(TOP_K);

  return results.map((r) => ({
    content: r.content,
    filename: r.filename,
    chunk_index: r.chunk_index,
    document_id: r.document_id,
  }));
}

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
  const query_embedding = await embed_text(args.query);
  const embedding_str = `[${query_embedding.join(",")}]`;

  const results = await db
    .select({
      content: chunks.content,
      chunk_index: chunks.chunk_index,
      document_id: chunks.document_id,
      filename: documents.filename,
      distance: sql<number>`(${chunks.embedding} <=> ${embedding_str}::vector)`,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.document_id, documents.id))
    .where(eq(chunks.workspace_id, workspace_id))
    .orderBy(sql`${chunks.embedding} <=> ${embedding_str}::vector`)
    .limit(TOP_K);

  let relevant: TSearchDocumentsChunk[] = results
    .filter((r) => r.distance < SIMILARITY_THRESHOLD)
    .map((r) => ({
      content: r.content,
      filename: r.filename,
      chunk_index: r.chunk_index,
      document_id: r.document_id,
    }));

  // Vague or meta-phrased queries ("brief from the doc") often miss on vectors
  // alone — fall back to keyword matching on meaningful terms in the query.
  if (relevant.length === 0) {
    relevant = await keyword_search(
      workspace_id,
      extract_search_terms(args.query)
    );
  }

  if (relevant.length === 0) {
    return {
      found: false,
      results: [],
      message:
        "No relevant information found in the workspace's documents for this query.",
    };
  }

  return { found: true, results: relevant };
}
