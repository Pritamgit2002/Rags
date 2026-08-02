import { db } from "@/lib/drizzle";
import { workspaces, type Workspace } from "@repo/db";
import { and, eq } from "drizzle-orm";

export async function get_owned_workspace(
  workspace_id: string,
  owner_id: string
): Promise<Workspace | null> {
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(
      and(eq(workspaces.id, workspace_id), eq(workspaces.owner_id, owner_id))
    );
  return ws ?? null;
}
