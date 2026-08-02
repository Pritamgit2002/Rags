import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";

export const z_send_discord = z.object({
  message: z
    .string()
    .min(1)
    .max(2000)
    .describe("Message content to send to Discord (max 2000 chars)"),
});

export type TSendDiscordArgs = z.infer<typeof z_send_discord>;

export const send_discord_declaration: ChatCompletionTool = {
  type: "function",
  function: {
    name: "send_discord_summary",
    description:
      "Send a summary message to the workspace Discord channel. Use only when the user explicitly asks to send or notify Discord.",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Message content to send (max 2000 chars)",
        },
      },
      required: ["message"],
    },
  },
};
