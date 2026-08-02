import { create_workspace } from "@/controllers/workspace/create-workspace";
import { delete_workspace } from "@/controllers/workspace/delete-workspace";
import { get_workspaces } from "@/controllers/workspace/get-workspaces";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const workspace_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_workspaces);
  app.post("/", create_workspace);
  app.delete("/:id", delete_workspace);
};
