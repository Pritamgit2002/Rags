"use client";

import { useRef, useState } from "react";
import { createClient } from "@/services/supabase";
import { env } from "@/constants/env";

export type TStreamToolCall = { tool_name: string; arguments: unknown };
export type TStreamToolResult = { tool_name: string; result: unknown };

export type TChatStreamState = {
  is_streaming: boolean;
  /** Text received from the model so far in the current stream */
  streaming_text: string;
  /** Latest status message (e.g. "Searching documents…") */
  status: string | null;
  tool_calls: TStreamToolCall[];
  tool_results: TStreamToolResult[];
  error: string | null;
  /** Set to true when the model calls delete_everything — triggers the native dialog */
  delete_confirmation_pending: boolean;
};

const INITIAL: TChatStreamState = {
  is_streaming: false,
  streaming_text: "",
  status: null,
  tool_calls: [],
  tool_results: [],
  error: null,
  delete_confirmation_pending: false,
};

export function useChatStream() {
  const [state, setState] = useState<TChatStreamState>(INITIAL);
  const abort_ref = useRef<AbortController | null>(null);

  const stream_chat = async (
    workspace_id: string,
    message: string,
    on_complete: (message_id: string, user_message_id: string) => void,
    on_error?: (err: string) => void
  ) => {
    // Cancel any previous in-flight stream
    abort_ref.current?.abort();

    setState((s) => ({
      ...INITIAL,
      is_streaming: true,
      // Preserve dialog if it was already open when a new message is sent
      delete_confirmation_pending: s.delete_confirmation_pending,
    }));

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setState((s) => ({
        ...s,
        is_streaming: false,
        error: "Not authenticated",
      }));
      return;
    }

    const controller = new AbortController();
    abort_ref.current = controller;

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ message, workspaceId: workspace_id }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let error_message = `Stream request failed (${res.status})`;
        try {
          const err_body = await res.json();
          error_message = err_body?.message ?? err_body?.error ?? error_message;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(error_message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event_match = part.match(/^event: (\S+)/m);
          const data_match = part.match(/^data: (.+)/m);
          if (!event_match || !data_match) continue;

          const event = event_match[1]!;
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(data_match[1]!);
          } catch {
            continue;
          }

          switch (event) {
            case "validated":
              setState((s) => ({ ...s, status: "Connected…" }));
              break;

            case "status":
              setState((s) => ({ ...s, status: String(data["text"] ?? "") }));
              break;

            case "text-delta":
              setState((s) => ({
                ...s,
                streaming_text: s.streaming_text + String(data["text"] ?? ""),
                status: null,
              }));
              break;

            case "tool-call":
              setState((s) => ({
                ...s,
                tool_calls: [
                  ...s.tool_calls,
                  {
                    tool_name: String(data["tool_name"]),
                    arguments: data["arguments"],
                  },
                ],
              }));
              break;

            case "tool-result":
              setState((s) => ({
                ...s,
                tool_results: [
                  ...s.tool_results,
                  {
                    tool_name: String(data["tool_name"]),
                    result: data["result"],
                  },
                ],
                // Detect delete_everything confirmation request
                delete_confirmation_pending:
                  s.delete_confirmation_pending ||
                  (data["tool_name"] === "delete_everything" &&
                    typeof data["result"] === "object" &&
                    data["result"] !== null &&
                    (data["result"] as Record<string, unknown>)[
                      "needs_confirmation"
                    ] === true),
              }));
              break;

            case "complete":
              setState((s) => ({ ...s, is_streaming: false, status: null }));
              on_complete(
                String(data["message_id"] ?? ""),
                String(data["user_message_id"] ?? "")
              );
              break;

            case "error":
              setState((s) => ({
                ...s,
                is_streaming: false,
                error: String(data["message"] ?? "Stream error"),
              }));
              on_error?.(String(data["message"] ?? "Stream error"));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Stream failed";
      setState((s) => ({ ...s, is_streaming: false, error: msg }));
      on_error?.(msg);
    }
  };

  const abort = () => {
    abort_ref.current?.abort();
    abort_ref.current = null;
    setState((s) => ({ ...s, is_streaming: false, status: null }));
  };

  const reset = () =>
    setState((s) => ({
      ...INITIAL,
      // Keep dialog open if it was triggered during this stream
      delete_confirmation_pending: s.delete_confirmation_pending,
    }));

  const dismiss_delete_confirmation = () =>
    setState((s) => ({ ...s, delete_confirmation_pending: false }));

  return { ...state, stream_chat, abort, reset, dismiss_delete_confirmation };
}
