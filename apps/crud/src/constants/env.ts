function get(key: string, required: true): string;
function get(key: string, required?: false): string | undefined;
function get(key: string, required = false): string | undefined {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: get("CRUD_PORT") ?? "8000",
  DATABASE_URL: get("DATABASE_URL", true),
  SUPABASE_URL: get("NEXT_PUBLIC_SUPABASE_URL", true),
  SUPABASE_SERVICE_ROLE_KEY: get("SUPABASE_SERVICE_ROLE_KEY", true),
  R2_ACCOUNT_ID: get("R2_ACCOUNT_ID"),
  R2_ACCESS_KEY_ID: get("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: get("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET_NAME: get("R2_BUCKET_NAME"),
  R2_PUBLIC_URL: get("R2_PUBLIC_URL"),
  OPENAI_API_KEY: get("OPENAI_API_KEY", true),
  DISCORD_WEBHOOK_URL: get("DISCORD_WEBHOOK_URL", true),
} as const;
