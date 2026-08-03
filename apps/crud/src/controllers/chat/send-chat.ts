import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { get_owned_workspace } from "@/services/workspace-access";
import { db } from "@/lib/drizzle";
import { chat_messages } from "@repo/db";
import { rag_chat } from "@/lib/rag-chat";

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
    const chat_result = await rag_chat(message, workspaceId);

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

const z_send_chat_body = z.object({
  message: z.string().min(1).max(4000),
  workspaceId: z.string().uuid(),
});
