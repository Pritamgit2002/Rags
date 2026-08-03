import { get_chat_messages } from "@/controllers/chat/get-chat";
import { send_chat_message } from "@/controllers/chat/send-chat";
import { stream_chat_message } from "@/controllers/chat/chat-stream";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const chat_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_chat_messages);
  app.post("/", send_chat_message);
  app.post("/stream", stream_chat_message);
};
