import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@repo/db";
import { env } from "@/constants/env";

const postgres_client = postgres(env.DATABASE_URL);

export const db = drizzle(postgres_client, { schema });
