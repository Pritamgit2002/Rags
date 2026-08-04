import { tool } from "ai";

import { db } from "@/lib/drizzle";
import { tool_calls } from "@repo/db";

import {
  SEARCH_DOCUMENTS_DESCRIPTION,
  z_search_documents,
} from "./search-documents/definition";
import { execute_search_documents } from "./search-documents/execute";
import { SAVE_TASK_DESCRIPTION, z_save_task } from "./save-task/definition";
import { execute_save_task } from "./save-task/execute";
import {
  SEND_DISCORD_DESCRIPTION,
  z_send_discord,
} from "./send-discord-summary/definition";
import { execute_send_discord } from "./send-discord-summary/execute";
import {
  DELETE_EVERYTHING_DESCRIPTION,
  z_delete_everything,
} from "./delete-everything/definition";
import { execute_delete_everything } from "./delete-everything/execute";

export type TToolContext = {
  workspace_id: string;
};

/**
 * Wraps a tool's execute function with DB logging so every invocation —
 * success or failure — is recorded in the `tool_calls` table.
 * Never throws: failures are returned as `{ error }` objects so the model
 * receives a structured error result rather than a crash.
 */
async function with_db_logging(
  tool_name: string,
  workspace_id: string,
  input: Record<string, unknown>,
  fn: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  let result: Record<string, unknown>;
  let status: "success" | "error" = "success";

  try {
    result = await fn();
  } catch (err) {
    status = "error";
    result = { error: err instanceof Error ? err.message : String(err) };
  }

  await db
    .insert(tool_calls)
    .values({ workspace_id, tool_name, arguments: input, result, status })
    .catch((e) => console.error("[tools] failed to log tool call", e));

  return result;
}

/**
 * Builds the AI SDK tool set scoped to a workspace.
 *
 * Each entry uses Vercel AI SDK's `tool()` helper — the Zod `inputSchema`
 * is provider-agnostic, so switching the underlying LLM in
 * `src/lib/ai-model.ts` requires zero changes here.
 */
export function create_tools(ctx: TToolContext) {
  return {
    search_documents: tool({
      description: SEARCH_DOCUMENTS_DESCRIPTION,
      inputSchema: z_search_documents,
      execute: (input, _options) =>
        with_db_logging(
          "search_documents",
          ctx.workspace_id,
          input as Record<string, unknown>,
          () => execute_search_documents(input, ctx.workspace_id)
        ),
    }),

    save_task: tool({
      description: SAVE_TASK_DESCRIPTION,
      inputSchema: z_save_task,
      execute: (input, _options) =>
        with_db_logging(
          "save_task",
          ctx.workspace_id,
          input as Record<string, unknown>,
          () => execute_save_task(input, ctx.workspace_id)
        ),
    }),

    send_discord_summary: tool({
      description: SEND_DISCORD_DESCRIPTION,
      inputSchema: z_send_discord,
      execute: (input, _options) =>
        with_db_logging(
          "send_discord_summary",
          ctx.workspace_id,
          input as Record<string, unknown>,
          () => execute_send_discord(input)
        ),
    }),

    delete_everything: tool({
      description: DELETE_EVERYTHING_DESCRIPTION,
      inputSchema: z_delete_everything,
      execute: (input, _options) =>
        with_db_logging(
          "delete_everything",
          ctx.workspace_id,
          input as Record<string, unknown>,
          () => execute_delete_everything(input, ctx.workspace_id)
        ),
    }),
  };
}
