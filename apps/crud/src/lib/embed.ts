import { embed } from "ai";

import { EMBED_MODEL } from "@/lib/ai-model";

/** Must match the vector(768) column in the chunks table. */
const EMBEDDING_DIMENSIONS = 768;

export async function embed_text(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBED_MODEL,
    value: text,
    // Dimensions are a provider-level option so switching EMBED_MODEL to a
    // different provider only requires updating ai-model.ts + this key name.
    providerOptions: { openai: { dimensions: EMBEDDING_DIMENSIONS } },
  });

  if (!embedding?.length) {
    throw new Error("Embedding model returned empty vector");
  }

  return embedding;
}
