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

export const SAVE_TASK_DESCRIPTION =
  "Save a task to the workspace task list. " +
  "Use only when the user explicitly asks to save, remember, or create a task.";
