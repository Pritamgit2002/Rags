import { db } from "@/lib/drizzle";
import { workspaces } from "@repo/db";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";

export const get_workspaces = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.owner_id, req.user.id))
    .orderBy(workspaces.created_at);

  reply.send({ message: "Workspaces fetched", data: rows });
};
