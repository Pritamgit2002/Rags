import { env } from "@/constants/env";
import { build_raw_content_prompt } from "@/lib/prompt/raw-content";
import { create_openai_client } from "@/lib/openai-client";

const VISION_MODEL_ID = "gpt-5-mini" as const;

function is_ocr_refusal(text: string): boolean {
  const normalized = text.toLowerCase();
  const refusal_patterns = [
    "too low-resolution",
    "too low resolution",
    "higher-resolution image",
    "higher resolution image",
    "please supply a higher",
    "please provide a higher",
    "cannot accurately preserve",
    "cannot accurately transcribe",
    "i cannot accurately",
    "image is too blurred",
    "too blurred for",
    "cannot transcribe",
    "unable to transcribe",
  ];
  return refusal_patterns.some((pattern) => normalized.includes(pattern));
}

function build_ocr_instructions(
  page_number: number,
  mode: "full" | "fallback"
): string {
  if (mode === "fallback") {
    return `Transcribe ALL visible text from page ${page_number} of a document.

    Rules:
    - Output ONLY transcribed page text.
    - Never refuse, never comment on image quality, never ask for a better image.
    - Transcribe everything you can read; use [unclear] only for unreadable fragments.
    - Preserve line breaks, numbering, options, and reading order.
    - Do not summarize, paraphrase, or add explanations.`;
  }

  return build_raw_content_prompt(page_number);
}

/**
 * Extracts raw text from a single PDF page image (base64 JPEG or PNG).
 * Returns plain text only; `page_number` is stored in DB columns.
 */
export async function extract_raw_content(
  page_base64: string,
  page_number: number,
  api_key: string = env.OPENAI_API_KEY,
  image_mime: "image/jpeg" | "image/png" = "image/png",
  mode: "full" | "fallback" = "full"
): Promise<string> {
  const client = create_openai_client(api_key);
  const instructions = build_ocr_instructions(page_number, mode);

  const response = await client.chat.completions.create({
    model: VISION_MODEL_ID,
    temperature: 0,
    max_tokens: 8_192,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instructions },
          {
            type: "image_url",
            image_url: {
              url: `data:${image_mime};base64,${page_base64}`,
            },
          },
        ],
      },
    ],
  });

  const trimmed = response.choices[0]?.message?.content?.trim();
  if (!trimmed) {
    throw new Error(`Model returned empty content for page ${page_number}`);
  }

  if (is_ocr_refusal(trimmed)) {
    throw new Error(
      `OCR model refused page ${page_number}: ${trimmed.slice(0, 240)}`
    );
  }

  return trimmed;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function extract_raw_content_with_retry(
  page_base64: string,
  page_number: number,
  api_key: string = env.OPENAI_API_KEY,
  image_mime: "image/jpeg" | "image/png" = "image/png",
  max_attempts = 3
): Promise<string> {
  let last_error: unknown;

  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    try {
      const mode = attempt === 1 ? "full" : "fallback";
      return await extract_raw_content(
        page_base64,
        page_number,
        api_key,
        image_mime,
        mode
      );
    } catch (err) {
      last_error = err;
      if (attempt === max_attempts) break;
      await sleep(2_000 * attempt);
    }
  }

  throw last_error instanceof Error
    ? last_error
    : new Error(`OCR failed for page ${page_number}`);
}
