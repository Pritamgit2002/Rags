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
  DATABASE_URL: get("DATABASE_URL", true),
} as const;
