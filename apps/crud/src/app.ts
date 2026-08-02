import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import { item_routes } from "./routes/item";
import { storage_routes } from "./routes/storage";
import { workspace_routes } from "./routes/workspace";
import { document_routes } from "./routes/document";
import { task_routes } from "./routes/task";
import { tool_call_routes } from "./routes/tool-call";
import { chat_routes } from "./routes/chat";

export const buildApp = () => {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, { origin: true });
  app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });
  app.register(item_routes, { prefix: "/items" });
  app.register(storage_routes, { prefix: "/storage" });
  app.register(workspace_routes, { prefix: "/workspaces" });
  app.register(document_routes, { prefix: "/documents" });
  app.register(task_routes, { prefix: "/tasks" });
  app.register(tool_call_routes, { prefix: "/tool-calls" });
  app.register(chat_routes, { prefix: "/chat" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
};
