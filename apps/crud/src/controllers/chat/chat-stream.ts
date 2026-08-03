import { rag_chat_stream } from "@/lib/rag-chat";
import { db } from "@/lib/drizzle";
import { chat_messages } from "@repo/db";
import { get_owned_workspace } from "@/services/workspace-access";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const stream_chat_message = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // --- Validation (before hijacking so we can return HTTP errors normally) ---
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const parsed = z_stream_chat_body.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({
      message: parsed.error.issues[0]?.message ?? "Bad request",
      data: null,
    });
  }

  const { message, workspaceId } = parsed.data;

  const ws = await get_owned_workspace(workspaceId, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  // Persist user message before streaming starts so it's never lost on failure
  const [user_msg] = await db
    .insert(chat_messages)
    .values({ workspace_id: workspaceId, role: "user", content: message })
    .returning();

  if (!user_msg) {
    return reply
      .status(500)
      .send({ message: "Failed to persist message", data: null });
  }

  // --- Take over the raw socket for SSE ---
  // hijack bypasses @fastify/cors — must set CORS headers ourselves
  await reply.hijack();
  const raw = reply.raw;
  const origin =
    typeof req.headers.origin === "string" ? req.headers.origin : "*";

  raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable nginx buffering when proxied
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
  });

  const send = (event: string, data: unknown) => {
    raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Signal that the request is valid and streaming begins
  send("validated", { user_message_id: user_msg.id });

  try {
    // Retrieval is not forced up front — the orchestrator decides whether
    // this turn is conversational or needs grounding via the
    // search_documents tool call (see SYSTEM_INSTRUCTION in rag-chat.ts).
    const chat_result = await rag_chat_stream(message, workspaceId, {
      on_status: (text) => send("status", { text }),
      on_text_delta: (text) => send("text-delta", { text }),
      on_tool_call_event: (tool_name, args) =>
        send("tool-call", { tool_name, arguments: args }),
      on_tool_result_event: (tool_name, result) =>
        send("tool-result", { tool_name, result }),
    });

    const [assistant_msg] = await db
      .insert(chat_messages)
      .values({
        workspace_id: workspaceId,
        role: "assistant",
        content: chat_result.text,
        citations: chat_result.citations,
      })
      .returning();

    send("complete", {
      message_id: assistant_msg!.id,
      user_message_id: user_msg.id,
    });
    raw.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stream failed";
    send("error", { message: msg });
    raw.end();
  }
};

const z_stream_chat_body = z.object({
  message: z.string().min(1).max(4000),
  workspaceId: z.string().uuid(),
});
