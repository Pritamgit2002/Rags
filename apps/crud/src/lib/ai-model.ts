import { openai } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel } from "ai";

// ─── Change provider here ──────────────────────────────────────────────────
//
// Google Gemini:
//   import { google } from "@ai-sdk/google"
//   export const CHAT_MODEL: LanguageModel   = google("gemini-2.0-flash")
//   export const VISION_MODEL: LanguageModel = google("gemini-2.0-flash")
//   export const EMBED_MODEL: EmbeddingModel = google.textEmbeddingModel("text-embedding-004")
//   // dimensions via embed() providerOptions: { google: { outputDimensionality: 768 } }
//
// Anthropic Claude:
//   import { anthropic } from "@ai-sdk/anthropic"
//   export const CHAT_MODEL: LanguageModel   = anthropic("claude-opus-4-5")
//   export const VISION_MODEL: LanguageModel = anthropic("claude-opus-4-5")
//   // Anthropic has no embedding model — keep EMBED_MODEL on openai
//
// ──────────────────────────────────────────────────────────────────────────

export const CHAT_MODEL: LanguageModel = openai("gpt-4o-mini");

/** Vision model used for PDF-page OCR. Can differ from CHAT_MODEL. */
export const VISION_MODEL: LanguageModel = openai("gpt-4o-mini");

/**
 * Embedding model.
 * NOTE: The required 768-dimension output is configured at call time via
 * `providerOptions` inside `embed_text()` — see src/lib/embed.ts.
 */
export const EMBED_MODEL: EmbeddingModel = openai.embedding(
  "text-embedding-3-small"
);
