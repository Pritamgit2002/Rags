import { FastifyReply, FastifyRequest } from "fastify";
import { listObjects } from "@/services/storage";

export const list_storage_objects = async (
  req: FastifyRequest<{ Querystring: { prefix?: string } }>,
  reply: FastifyReply
) => {
  const objects = await listObjects(req.query.prefix);
  reply.send(objects);
};
