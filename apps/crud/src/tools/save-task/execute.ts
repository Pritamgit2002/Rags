import { db } from "@/lib/drizzle";
import { tasks } from "@repo/db";
import type { TSaveTaskArgs } from "./definition";

export async function execute_save_task(
  args: TSaveTaskArgs,
  workspace_id: string
): Promise<Record<string, unknown>> {
  const saved_rows = await db
    .insert(tasks)
    .values({ workspace_id, title: args.title, description: args.description })
    .returning();

  return {
    success: true,
    task_id: saved_rows[0]?.id,
    message: `Task "${args.title}" saved`,
  };
}
