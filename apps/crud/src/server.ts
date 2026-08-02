import { buildApp } from "./app";
import { env } from "./constants/env";
import { db } from "./lib/drizzle";
import { sql } from "drizzle-orm";

const PORT = Number(env.PORT);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  await db.execute(sql`SELECT 1`);

  const app = buildApp();

  await app.listen({ port: PORT, host: HOST });
  console.log(`crud running on port ${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
