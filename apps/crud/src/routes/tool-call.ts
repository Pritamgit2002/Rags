import { get_tool_calls } from "@/controllers/tool-call/get-tool-calls";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const tool_call_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_tool_calls);
};
