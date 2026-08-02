import { PDFParse } from "pdf-parse";
import { is_pdf, is_text_extractable } from "@/helpers/file";

/** Strip null bytes — Postgres text columns reject `\0`. */
export function sanitize_extracted_text(text: string): string {
  return text.replace(/\0/g, "").trim();
}

async function extract_pdf_text(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return sanitize_extracted_text(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

export async function extract_document_text(
  buffer: Buffer,
  mime_type: string,
  filename: string
): Promise<string> {
  if (is_pdf(mime_type, filename)) {
    return extract_pdf_text(buffer);
  }

  if (is_text_extractable(mime_type, filename)) {
    return sanitize_extracted_text(buffer.toString("utf8"));
  }

  throw new Error(`Unsupported file type for text extraction: ${mime_type}`);
}
