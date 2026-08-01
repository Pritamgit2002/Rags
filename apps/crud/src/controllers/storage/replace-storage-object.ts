import { FastifyReply, FastifyRequest } from "fastify";
import { uploadObject } from "@/services/storage";

export const replace_storage_object = async (
  req: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
) => {
  const data = await req.file();
  if (!data) return reply.status(400).send({ message: "No file provided" });
  const buffer = await data.toBuffer();
  const result = await uploadObject(req.params.key, buffer, data.mimetype);
  reply.send(result);
};
