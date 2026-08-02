import { db } from "@/lib/drizzle";
import { workspaces } from "@repo/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const create_workspace = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.user) {
    return reply
      .status(401)
      .send({ error: "User not authenticated", code: 401 });
  }

  const { name } = z_create_workspace_body.parse(req.body);

  const [row] = await db
    .insert(workspaces)
    .values({ name, owner_id: req.user.id })
    .returning();

  reply.status(201).send({ message: "Workspace created", data: row });
};

const z_create_workspace_body = z.object({
  name: z.string().min(1).max(80),
});
