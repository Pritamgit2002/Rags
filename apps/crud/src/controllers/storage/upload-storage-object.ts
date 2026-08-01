import { FastifyReply, FastifyRequest } from "fastify";
import { uploadObject } from "@/services/storage";

export const upload_storage_object = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const data = await req.file();
  if (!data) return reply.status(400).send({ message: "No file provided" });
  const buffer = await data.toBuffer();
  const result = await uploadObject(data.filename, buffer, data.mimetype);
  reply.status(201).send(result);
};
