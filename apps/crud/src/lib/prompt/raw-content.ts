/** Full-mode OCR instructions for a single document page image. */
export function build_raw_content_prompt(page_number: number): string {
  return `Transcribe ALL visible text from page ${page_number} of a document.

Rules:
- Output ONLY the transcribed page text — no preamble, no commentary, no markdown fences.
- Preserve the original structure: headings, paragraphs, line breaks, numbered lists, bullet points, tables, and reading order.
- Transcribe headers, footers, page numbers, captions, and footnotes when visible.
- For tables, preserve row/column structure using spacing or simple delimiters.
- Use [unclear] only for fragments that are partially unreadable.
- Do not summarize, paraphrase, interpret, or add explanations.
- Do not refuse based on image quality — transcribe everything you can read.`;
}
