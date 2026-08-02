import { get_chat_messages, send_chat_message } from "@/controllers/chat/chat";
import { stream_chat_message } from "@/controllers/chat/chat-stream";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const chat_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_chat_messages);
  app.post("/", send_chat_message);
  app.post("/stream", stream_chat_message);
};
