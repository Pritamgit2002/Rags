import { drizzle } from "drizzle-orm/postgres-js";
import { postgres_client } from "./postgres";
import * as schema from "../schema";

export const drizzle_client = drizzle(postgres_client, { schema });
