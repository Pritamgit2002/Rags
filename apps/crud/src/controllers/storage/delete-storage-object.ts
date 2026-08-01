import { FastifyReply, FastifyRequest } from "fastify";
import { deleteObject } from "@/services/storage";

export const delete_storage_object = async (
  req: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
) => {
  await deleteObject(req.params.key);
  reply.status(204).send();
};
