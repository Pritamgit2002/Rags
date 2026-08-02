import { db } from "@/lib/drizzle";
import { tool_calls } from "@repo/db";
import { create_tools } from "@/tools";

export async function execute_tool_call(
  tool_name: string,
  raw_args: unknown,
  workspace_id: string
): Promise<Record<string, unknown>> {
  const tools = create_tools({ workspace_id });
  const tool = tools[tool_name];

  if (!tool) {
    const result = { error: `Unknown tool: ${tool_name}` };
    await db.insert(tool_calls).values({
      workspace_id,
      tool_name,
      arguments: (raw_args ?? {}) as Record<string, unknown>,
      result,
      status: "error",
    });
    return result;
  }

  const parsed = tool.schema.safeParse(raw_args);
  if (!parsed.success) {
    const result = {
      error: `Invalid arguments for ${tool_name}: ${parsed.error.issues[0]?.message}`,
    };
    await db.insert(tool_calls).values({
      workspace_id,
      tool_name,
      arguments: (raw_args ?? {}) as Record<string, unknown>,
      result,
      status: "error",
    });
    return result;
  }

  let exec_result: Record<string, unknown>;

  try {
    exec_result = await tool.execute(parsed.data);

    await db.insert(tool_calls).values({
      workspace_id,
      tool_name,
      arguments: raw_args as Record<string, unknown>,
      result: exec_result,
      status: "success",
    });
  } catch (err) {
    exec_result = {
      error: err instanceof Error ? err.message : String(err),
    };
    await db.insert(tool_calls).values({
      workspace_id,
      tool_name,
      arguments: raw_args as Record<string, unknown>,
      result: exec_result,
      status: "error",
    });
  }

  return exec_result;
}
