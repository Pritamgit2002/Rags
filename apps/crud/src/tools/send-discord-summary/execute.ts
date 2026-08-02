import { env } from "@/constants/env";
import type { TSendDiscordArgs } from "./definition";

export async function execute_send_discord(
  args: TSendDiscordArgs
): Promise<Record<string, unknown>> {
  const resp = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: args.message }),
  });

  if (!resp.ok) {
    throw new Error(`Discord returned ${resp.status}`);
  }

  return { success: true, message: "Discord message sent" };
}
