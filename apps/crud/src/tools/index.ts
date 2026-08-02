import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { ZodType } from "zod";

import { save_task_declaration, z_save_task } from "./save-task/definition";
import { execute_save_task } from "./save-task/execute";
import {
  send_discord_declaration,
  z_send_discord,
} from "./send-discord-summary/definition";
import { execute_send_discord } from "./send-discord-summary/execute";
import {
  search_documents_declaration,
  z_search_documents,
} from "./search-documents/definition";
import { execute_search_documents } from "./search-documents/execute";

export type TToolContext = {
  workspace_id: string;
};

type TTool = {
  declaration: ChatCompletionTool;
  schema: ZodType<unknown>;
  execute: (args: unknown) => Promise<Record<string, unknown>>;
};

export type TToolMap = Record<string, TTool>;

export function create_tools(ctx: TToolContext): TToolMap {
  return {
    search_documents: {
      declaration: search_documents_declaration,
      schema: z_search_documents,
      execute: async (args) => {
        const parsed = z_search_documents.parse(args);
        return execute_search_documents(parsed, ctx.workspace_id);
      },
    },

    save_task: {
      declaration: save_task_declaration,
      schema: z_save_task,
      execute: async (args) => {
        const parsed = z_save_task.parse(args);
        return execute_save_task(parsed, ctx.workspace_id);
      },
    },

    send_discord_summary: {
      declaration: send_discord_declaration,
      schema: z_send_discord,
      execute: async (args) => {
        const parsed = z_send_discord.parse(args);
        return execute_send_discord(parsed);
      },
    },
  };
}

export const TOOL_DECLARATIONS: ChatCompletionTool[] = [
  search_documents_declaration,
  save_task_declaration,
  send_discord_declaration,
];
