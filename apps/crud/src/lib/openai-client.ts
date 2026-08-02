import OpenAI from "openai";
import { env } from "@/constants/env";

const openai_client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export function create_openai_client(
  api_key: string = env.OPENAI_API_KEY
): OpenAI {
  if (api_key === env.OPENAI_API_KEY) return openai_client;
  return new OpenAI({ apiKey: api_key });
}
