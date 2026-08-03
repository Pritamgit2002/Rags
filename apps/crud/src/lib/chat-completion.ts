export type TCitation = {
  filename: string;
  chunk_index: number;
  document_id: string;
};

export type TChatResult = {
  text: string;
  citations: TCitation[];
  tool_calls_made: Array<{ name: string; args: unknown }>;
};

export type TStreamEmitters = {
  on_status: (text: string) => void;
  on_text_delta: (text: string) => void;
  on_tool_call_event: (name: string, args: unknown) => void;
  on_tool_result_event: (name: string, result: unknown) => void;
};

/**
 * Orchestrator entry point (non-streaming).
 *
 * The model decides per-turn whether to call search_documents or respond
 * directly. `stopWhen: isStepCount` drives the tool loop — no manual
 * accumulation needed.
 */
export async function chat_completion(
  user_message: string,
  workspace_id: string
): Promise<TChatResult | null> {
  return null;
}

/**
 * Streaming variant.
 *
 * Text deltas, tool-call events, and tool-result events are emitted in
 * real-time via `emitters`. The full final text is returned for DB
 * persistence after the stream ends.
 */
export async function chat_completion_stream(
  user_message: string,
  workspace_id: string,
  emitters: TStreamEmitters
): Promise<TChatResult | null> {
  return null;
}
