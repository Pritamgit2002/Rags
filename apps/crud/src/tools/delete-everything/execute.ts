import type { TDeleteEverythingArgs } from "./definition";

/**
 * The tool itself never performs the deletion — it only signals the frontend
 * that the user's intent was detected. The actual wipe is handled by the
 * dedicated REST endpoint `DELETE /workspaces/:id/everything`, which the
 * frontend calls after the user confirms in the native dialog.
 *
 * This keeps the destructive action out of LLM control entirely.
 */
export async function execute_delete_everything(
  _args: TDeleteEverythingArgs,
  _workspace_id: string
): Promise<Record<string, unknown>> {
  return {
    needs_confirmation: true,
    message:
      "A confirmation dialog has been shown to the user. " +
      "Do not say anything more — wait for the user to confirm or cancel.",
  };
}
