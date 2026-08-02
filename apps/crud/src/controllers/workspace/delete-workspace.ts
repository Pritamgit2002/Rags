import { db } from "@/lib/drizzle";
import { workspaces } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const delete_workspace = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { id } = z_delete_workspace_params.parse(req.params);

  const deleted = await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.owner_id, req.user.id)))
    .returning();

  if (deleted.length === 0) {
    return reply
      .status(404)
      .send({ message: "Workspace not found", data: null });
  }

  reply.send({ message: "Workspace deleted", data: deleted[0] });
};

const z_delete_workspace_params = z.object({
  id: z.string().uuid(),
});
