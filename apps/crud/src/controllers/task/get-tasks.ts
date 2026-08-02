import { db } from "@/lib/drizzle";
import { tasks } from "@repo/db";
import { get_owned_workspace } from "@/services/workspace-access";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const get_tasks = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { workspaceId } = z_get_tasks_query.parse(req.query);

  const ws = await get_owned_workspace(workspaceId, req.user.id);
  if (!ws) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.workspace_id, workspaceId))
    .orderBy(tasks.created_at);

  reply.send({ message: "Tasks fetched", data: rows });
};

const z_get_tasks_query = z.object({
  workspaceId: z.string().uuid(),
});
