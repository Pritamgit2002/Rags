import { FastifyReply, FastifyRequest } from "fastify";
import { items, type NewItem } from "@repo/db";
import { db } from "@/lib/drizzle";

export const create_item = async (
  req: FastifyRequest<{ Body: NewItem }>,
  reply: FastifyReply
) => {
  const [item] = await db.insert(items).values(req.body).returning();
  reply.status(201).send(item);
};
