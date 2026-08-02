import { create_openai_client } from "@/lib/openai-client";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768;

export async function embed_text(text: string): Promise<number[]> {
  const response = await create_openai_client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding?.length) {
    throw new Error("Embedding model returned empty vector");
  }

  return embedding;
}
