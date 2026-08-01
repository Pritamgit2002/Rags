import type { Config } from "drizzle-kit";

const url = process.env["DATABASE_URL"];

if (!url) {
  console.error(
    "\n\x1b[31m✖ Missing DATABASE_URL\x1b[0m\n" +
      "\x1b[33m  Copy .env.example to .env and set DATABASE_URL:\x1b[0m\n" +
      "\x1b[2m  DATABASE_URL=postgres://user:password@localhost:5432/dbname\x1b[0m\n"
  );
  process.exit(1);
}

export default {
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
