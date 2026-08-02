import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";

export const z_save_task = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Short task title (required, max 200 chars)"),
  description: z
    .string()
    .max(1000)
    .optional()
    .describe("Optional longer description (max 1000 chars)"),
});

export type TSaveTaskArgs = z.infer<typeof z_save_task>;

export const save_task_declaration: ChatCompletionTool = {
  type: "function",
  function: {
    name: "save_task",
    description:
      "Save a task to the workspace task list. Use only when the user explicitly asks to save, remember, or create a task.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short task title (required, max 200 chars)",
        },
        description: {
          type: "string",
          description: "Optional longer description (max 1000 chars)",
        },
      },
      required: ["title"],
    },
  },
};
