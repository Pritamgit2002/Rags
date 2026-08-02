function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Use direct process.env.NEXT_PUBLIC_* access so Next.js can inline values in the browser bundle.
export const env = {
  PORT: process.env.WEB_PORT ?? "3000",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_API_URL: requireEnv(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL"
  ),
  NEXT_PUBLIC_SUPABASE_URL: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
} as const;
