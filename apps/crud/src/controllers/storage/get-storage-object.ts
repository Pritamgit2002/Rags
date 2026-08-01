import { FastifyReply, FastifyRequest } from "fastify";
import { getObject } from "@/services/storage";

export const get_storage_object = async (
  req: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
) => {
  const { stream, contentType, contentLength } = await getObject(
    req.params.key
  );
  reply
    .header("Content-Type", contentType)
    .header("Content-Length", contentLength ?? "")
    .send(stream);
};
