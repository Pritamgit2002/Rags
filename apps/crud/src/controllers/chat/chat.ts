import { rag_chat } from "@/lib/rag-chat";
import { db } from "@/lib/drizzle";
import { chat_messages } from "@repo/db";
import { execute_tool_call } from "@/services/tool-executor";
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

export const send_chat_message = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { message, workspaceId } = z_send_chat_body.parse(req.body);

  const ws = await get_owned_workspace(workspaceId, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  const user_msg_rows = await db
    .insert(chat_messages)
    .values({ workspace_id: workspaceId, role: "user", content: message })
    .returning();
  const user_msg = user_msg_rows[0]!;

  try {
    // Retrieval is not forced up front — the orchestrator decides whether
    // this turn is conversational or needs grounding via the
    // search_documents tool call (see SYSTEM_INSTRUCTION in rag-chat.ts).
    const chat_result = await rag_chat(message, async (tool_name, args) =>
      execute_tool_call(tool_name, args, workspaceId)
    );

    const assistant_msg_rows = await db
      .insert(chat_messages)
      .values({
        workspace_id: workspaceId,
        role: "assistant",
        content: chat_result.text,
        citations: chat_result.citations,
      })
      .returning();
    const assistant_msg = assistant_msg_rows[0];

    reply.send({
      message: "Chat response generated",
      data: {
        userMessageId: user_msg.id,
        message: assistant_msg,
        tool_calls_made: chat_result.tool_calls_made,
      },
    });
  } catch (err) {
    const message_err = err instanceof Error ? err.message : "Chat failed";
    reply.status(500).send({ message: message_err, data: null });
  }
};

const z_get_chat_query = z.object({
  workspaceId: z.string().uuid(),
});

const z_send_chat_body = z.object({
  message: z.string().min(1).max(4000),
  workspaceId: z.string().uuid(),
});
