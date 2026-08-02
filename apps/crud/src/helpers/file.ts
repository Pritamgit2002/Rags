import { env } from "@/constants/env";

export function extract_r2_key(storage_url: string): string {
  if (env.R2_PUBLIC_URL && storage_url.startsWith(env.R2_PUBLIC_URL)) {
    return storage_url.slice(env.R2_PUBLIC_URL.replace(/\/$/, "").length + 1);
  }

  const bucket_path = `/${env.R2_BUCKET_NAME}/`;
  const bucket_index = storage_url.indexOf(bucket_path);
  if (bucket_index !== -1) {
    return storage_url.slice(bucket_index + bucket_path.length).split("?")[0]!;
  }

  try {
    const url = new URL(storage_url);
    return url.pathname.replace(/^\//, "").split("?")[0]!;
  } catch {
    return storage_url.split("?")[0]!;
  }
}

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".htm",
  ".log",
  ".yaml",
  ".yml",
]);

export function is_text_extractable(
  mime_type: string,
  filename: string
): boolean {
  if (mime_type.startsWith("text/")) return true;
  if (
    mime_type === "application/json" ||
    mime_type === "application/xml" ||
    mime_type === "application/x-yaml"
  ) {
    return true;
  }

  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  return TEXT_EXTENSIONS.has(ext);
}

export function is_pdf(mime_type: string, filename: string): boolean {
  if (mime_type === "application/pdf") return true;
  return filename.toLowerCase().endsWith(".pdf");
}

export function is_ingestible(mime_type: string, filename: string): boolean {
  return (
    is_text_extractable(mime_type, filename) || is_pdf(mime_type, filename)
  );
}
