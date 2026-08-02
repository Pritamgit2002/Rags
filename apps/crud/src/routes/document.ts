import { get_documents } from "@/controllers/document/get-documents";
import { upload_document } from "@/controllers/document/upload-document";
import { is_authenticated } from "@/middleware/is-authenticated";
import { FastifyInstance } from "fastify";

export const document_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_documents);
  app.post("/", upload_document);
};
