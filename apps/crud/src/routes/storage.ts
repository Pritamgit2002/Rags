import { FastifyInstance } from "fastify";
import { list_storage_objects } from "@/controllers/storage/list-storage-objects";
import { upload_storage_object } from "@/controllers/storage/upload-storage-object";
import { get_storage_object } from "@/controllers/storage/get-storage-object";
import { replace_storage_object } from "@/controllers/storage/replace-storage-object";
import { delete_storage_object } from "@/controllers/storage/delete-storage-object";

export const storage_routes = (app: FastifyInstance) => {
  app.get("/", list_storage_objects);
  app.post("/", upload_storage_object);
  app.get("/:key", get_storage_object);
  app.put("/:key", replace_storage_object);
  app.delete("/:key", delete_storage_object);
};
