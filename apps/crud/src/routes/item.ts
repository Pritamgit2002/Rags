import { FastifyInstance } from "fastify";

import { get_items } from "@/controllers/item/get-items";
import { get_item } from "@/controllers/item/get-item";
import { create_item } from "@/controllers/item/create-item";
import { update_item } from "@/controllers/item/update-item";
import { delete_item } from "@/controllers/item/delete-item";
import { is_authenticated } from "@/middleware/is-authenticated";

export const item_routes = (app: FastifyInstance) => {
  app.addHook("preHandler", is_authenticated);

  app.get("/", get_items);
  app.get("/:id", get_item);
  app.post("/", create_item);
  app.put("/:id", update_item);
  app.delete("/:id", delete_item);
};
