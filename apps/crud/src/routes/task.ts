import { get_tasks } from "@/controllers/task/get-tasks";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const task_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_tasks);
};
