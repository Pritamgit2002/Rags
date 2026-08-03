import { z } from "zod";

export const z_search_documents = z.object({
  query: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "Specific search terms from the user's question (key nouns, topics, names). " +
        "Do not use vague meta-phrases like 'from the doc' — extract the actual subject " +
        "(e.g. 'RAG problem statement', 'document ingestion requirements', 'brief')."
    ),
});

export type TSearchDocumentsArgs = z.infer<typeof z_search_documents>;

export const SEARCH_DOCUMENTS_DESCRIPTION =
  "Search the workspace's uploaded documents for content relevant to a query. " +
  "Call this whenever answering the user requires facts, details, or context that may live " +
  "in their uploaded documents. Never use this for greetings, small talk, or general " +
  "conversation, and never answer a document-dependent question without calling this first.";
