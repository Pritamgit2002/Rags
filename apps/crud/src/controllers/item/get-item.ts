import { FastifyReply, FastifyRequest } from "fastify";
import { items } from "@repo/db";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export const get_item = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, Number(req.params.id)));
  if (!item) return reply.status(404).send({ message: "Item not found" });
  reply.send(item);
};
