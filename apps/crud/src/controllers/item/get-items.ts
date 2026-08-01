import { FastifyReply, FastifyRequest } from "fastify";
import { items } from "@repo/db";
import { db } from "@/lib/drizzle";

export const get_items = async (_req: FastifyRequest, reply: FastifyReply) => {
  const result = await db.select().from(items);
  reply.send(result);
};
