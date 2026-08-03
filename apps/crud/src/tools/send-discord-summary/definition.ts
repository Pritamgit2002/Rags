import { z } from "zod";

export const z_send_discord = z.object({
  message: z
    .string()
    .min(1)
    .max(2000)
    .describe("Message content to send to Discord (max 2000 chars)"),
});

export type TSendDiscordArgs = z.infer<typeof z_send_discord>;

export const SEND_DISCORD_DESCRIPTION =
  "Send a summary message to the workspace Discord channel. " +
  "Use only when the user explicitly asks to send or notify Discord.";
