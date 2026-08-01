import { FastifyReply, FastifyRequest } from "fastify";
import { items, type NewItem } from "@repo/db";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export const update_item = async (
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<NewItem> }>,
  reply: FastifyReply
) => {
  const [item] = await db
    .update(items)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(items.id, Number(req.params.id)))
    .returning();
  if (!item) return reply.status(404).send({ message: "Item not found" });
  reply.send(item);
};
