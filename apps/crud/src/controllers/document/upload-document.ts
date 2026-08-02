import { chunk_text, sha256hex } from "@/lib/chunk";
import { db } from "@/lib/drizzle";
import { extract_document_text } from "@/lib/extract-text";
import { embed_text } from "@/lib/embed";
import { upload_to_r2 } from "@/lib/r2";
import { is_ingestible } from "@/helpers/file";
import { chunks, documents } from "@repo/db";
import { get_owned_workspace } from "@/services/workspace-access";
import { and, eq } from "drizzle-orm";
import type { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const upload_document = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  let file_data: MultipartFile | null = null;
  let workspace_id_raw: string | null = null;

  for await (const part of req.parts()) {
    if (part.type === "file" && part.fieldname === "file") {
      file_data = part;
    } else if (part.type === "field" && part.fieldname === "workspaceId") {
      workspace_id_raw = String(part.value);
    }
  }

  if (!file_data || !workspace_id_raw) {
    return reply
      .status(400)
      .send({ message: "file and workspaceId are required", data: null });
  }

  const parsed_fields = z_upload_document_fields.safeParse({
    workspaceId: workspace_id_raw,
  });
  if (!parsed_fields.success) {
    return reply
      .status(400)
      .send({ message: "Invalid workspaceId", data: null });
  }

  const { workspaceId: workspace_id } = parsed_fields.data;

  const ws = await get_owned_workspace(workspace_id, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  const buffer = await file_data.toBuffer();
  if (buffer.byteLength > MAX_FILE_SIZE) {
    return reply.status(400).send({
      message: "File exceeds 50 MB limit",
      data: null,
    });
  }

  const filename = file_data.filename || "upload";
  const mime_type = file_data.mimetype || "application/octet-stream";
  const content_hash = sha256hex(buffer);

  const [existing] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.workspace_id, workspace_id),
        eq(documents.content_hash, content_hash)
      )
    );

  if (existing) {
    return reply.send({
      message: "Document already ingested (same content hash)",
      data: existing,
    });
  }

  const key = `files/${req.user.id}/${randomUUID()}-${filename}`;
  let storage_url: string;

  try {
    storage_url = await upload_to_r2(key, buffer, mime_type);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file to storage";
    return reply.status(500).send({ message, data: null });
  }

  const doc_rows = await db
    .insert(documents)
    .values({
      workspace_id,
      filename,
      storage_url,
      mime_type,
      size: String(buffer.byteLength),
      content_hash,
      status: "processing",
    })
    .returning();
  const doc = doc_rows[0]!;

  if (!is_ingestible(mime_type, filename)) {
    const [stored] = await db
      .update(documents)
      .set({ status: "not_extractable" })
      .where(eq(documents.id, doc.id))
      .returning();

    return reply.status(201).send({
      message: "File stored (text extraction not supported for this type)",
      data: stored,
    });
  }

  try {
    const text = await extract_document_text(buffer, mime_type, filename);

    if (!text) {
      const [stored] = await db
        .update(documents)
        .set({ status: "not_extractable" })
        .where(eq(documents.id, doc.id))
        .returning();

      return reply.status(201).send({
        message:
          "File stored but no extractable text found (scanned PDFs are not supported yet)",
        data: stored,
      });
    }

    const text_chunks = chunk_text(text);

    if (text_chunks.length === 0) {
      console.warn("[upload] no chunks produced — nothing to embed", {
        doc_id: doc.id,
        text_length: text.length,
      });
    }

    for (let i = 0; i < text_chunks.length; i++) {
      console.log("[upload] embedding chunk", {
        doc_id: doc.id,
        chunk_index: i,
        chunk_length: text_chunks[i]!.length,
      });

      const embedding = await embed_text(text_chunks[i]!);
      console.log("[upload] embedding ok", {
        doc_id: doc.id,
        chunk_index: i,
        dims: embedding.length,
        first_3: embedding.slice(0, 3),
      });

      await db.insert(chunks).values({
        document_id: doc.id,
        workspace_id,
        chunk_index: i,
        content: text_chunks[i]!,
        embedding,
      });
      console.log("[upload] chunk row inserted", {
        doc_id: doc.id,
        chunk_index: i,
      });
    }

    const [ready] = await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, doc.id))
      .returning();

    console.log("[upload] ingestion complete", {
      doc_id: doc.id,
      chunk_count: text_chunks.length,
      status: ready?.status,
    });

    reply.status(201).send({ message: "Document ingested", data: ready });
  } catch (err) {
    console.error("[upload] ingestion failed", {
      doc_id: doc.id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    await db
      .update(documents)
      .set({ status: "error" })
      .where(eq(documents.id, doc.id));
    const message = err instanceof Error ? err.message : "Ingestion failed";
    reply.status(500).send({ message, data: null });
  }
};

const z_upload_document_fields = z.object({
  workspaceId: z.string().uuid(),
});
