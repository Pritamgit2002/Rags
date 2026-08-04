import { db } from "@/lib/drizzle";
import { get_owned_workspace } from "@/services/workspace-access";
import {
  chat_messages,
  chunks,
  documents,
  tasks,
  tool_calls,
  workspaces,
} from "@repo/db";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

/**
 * Wipes every table row belonging to the workspace, then deletes the workspace
 * itself — all inside a single transaction. This is called by the frontend
 * after the user confirms in the native dialog, never by the LLM directly.
 *
 * Deletion order: chunks → documents → chat_messages → tool_calls → tasks →
 * workspace. Chunks are deleted explicitly first (by workspace_id) so we
 * don't rely solely on the documents → chunks cascade.
 */
export const delete_workspace_everything = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { id } = z_params.parse(req.params);

  const ws = await get_owned_workspace(id, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  const counts = await db.transaction(async (tx) => {
    const deleted_chunks = await tx
      .delete(chunks)
      .where(eq(chunks.workspace_id, id))
      .returning({ id: chunks.id });

    const deleted_documents = await tx
      .delete(documents)
      .where(eq(documents.workspace_id, id))
      .returning({ id: documents.id });

    const deleted_messages = await tx
      .delete(chat_messages)
      .where(eq(chat_messages.workspace_id, id))
      .returning({ id: chat_messages.id });

    const deleted_tool_calls = await tx
      .delete(tool_calls)
      .where(eq(tool_calls.workspace_id, id))
      .returning({ id: tool_calls.id });

    const deleted_tasks = await tx
      .delete(tasks)
      .where(eq(tasks.workspace_id, id))
      .returning({ id: tasks.id });

    await tx.delete(workspaces).where(eq(workspaces.id, id));

    return {
      chunks: deleted_chunks.length,
      documents: deleted_documents.length,
      messages: deleted_messages.length,
      tool_calls: deleted_tool_calls.length,
      tasks: deleted_tasks.length,
    };
  });

  reply.send({ message: "Workspace and all data deleted", data: counts });
};

const z_params = z.object({ id: z.string().uuid() });
