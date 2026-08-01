import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import { item_routes } from "./routes/item";
import { storage_routes } from "./routes/storage";

export const buildApp = () => {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, { origin: true });
  app.register(multipart);
  app.register(item_routes, { prefix: "/items" });
  app.register(storage_routes, { prefix: "/storage" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
};
