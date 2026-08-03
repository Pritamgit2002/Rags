import { rag_chat } from "@/lib/rag-chat";
import { db } from "@/lib/drizzle";
import { chat_messages } from "@repo/db";
import { get_owned_workspace } from "@/services/workspace-access";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const get_chat_messages = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { workspaceId } = z_get_chat_query.parse(req.query);

  const ws = await get_owned_workspace(workspaceId, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  const msgs = await db
    .select()
    .from(chat_messages)
    .where(eq(chat_messages.workspace_id, workspaceId))
    .orderBy(chat_messages.created_at);

  reply.send({ message: "Chat messages fetched", data: msgs });
};

const z_get_chat_query = z.object({
  workspaceId: z.string().uuid(),
});
