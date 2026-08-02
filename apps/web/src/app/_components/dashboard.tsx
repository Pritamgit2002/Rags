"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGetChatMessages } from "@/hooks/api/chat";
import { useGetDocuments, useUploadDocument } from "@/hooks/api/document";
import { useGetTasks } from "@/hooks/api/task";
import { useGetToolCalls } from "@/hooks/api/tool-call";
import { useCreateWorkspace, useGetWorkspaces } from "@/hooks/api/workspace";
import { useChatStream } from "@/hooks/use-chat-stream";
import { invalidateQueries } from "@/lib/tanstack";
import type { TChatMessage } from "@/types/models/rag";
import { DocumentDropzone } from "./document-dropzone";

type Tab = "chat" | "documents" | "tool-calls" | "tasks";

export default function Dashboard({
  userName,
  userEmail,
  userAvatar,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}) {
  const [activeWs, setActiveWs] = useState<string | null>(null);
  const [newWsName, setNewWsName] = useState("");
  const [tab, setTab] = useState<Tab>("chat");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [uploadQueue, setUploadQueue] = useState(0);

  const {
    is_streaming,
    streaming_text,
    status,
    tool_calls: live_tool_calls,
    error: stream_error,
    stream_chat,
    abort,
    reset: reset_stream,
  } = useChatStream();

  const { data: workspacesData } = useGetWorkspaces();
  const workspaces = workspacesData?.data ?? [];

  useEffect(() => {
    const list = workspacesData?.data ?? [];
    if (list.length > 0 && !activeWs) {
      setActiveWs(list[0]!.id);
    }
  }, [workspacesData, activeWs]);

  // Abort stream and reset when workspace changes
  useEffect(() => {
    abort();
    reset_stream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs]);

  const workspaceParams = { workspaceId: activeWs ?? "" };

  const { data: chatData, refetch: refetch_chat } =
    useGetChatMessages(workspaceParams);
  const { data: docsData } = useGetDocuments(workspaceParams);
  const { data: toolCallsData, refetch: refetch_tool_calls } =
    useGetToolCalls(workspaceParams);
  const { data: tasksData, refetch: refetch_tasks } =
    useGetTasks(workspaceParams);

  const createWorkspaceMutation = useCreateWorkspace({
    onSuccess: (res) => {
      invalidateQueries({ queryKey: ["useGetWorkspaces"] });
      if (res.data) {
        setActiveWs(res.data.id);
        setNewWsName("");
      }
    },
  });

  const uploadDocumentMutation = useUploadDocument({
    onSuccess: () => {
      invalidateQueries({ queryKey: ["useGetDocuments"] });
    },
    onSettled: () => {
      setUploadQueue((n) => Math.max(0, n - 1));
    },
  });

  const persistedMessages: TChatMessage[] = chatData?.data ?? [];
  const docs = docsData?.data ?? [];
  const toolCalls = toolCallsData?.data ?? [];
  const taskList = tasksData?.data ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [persistedMessages, streaming_text, is_streaming, status]);

  function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspaceMutation.mutate({ name: newWsName.trim() });
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !activeWs || is_streaming) return;

    const msg = chatInput.trim();
    setChatInput("");

    stream_chat(
      activeWs,
      msg,
      () => {
        // On stream complete: refresh persisted data
        refetch_chat();
        refetch_tool_calls();
        refetch_tasks();
        reset_stream();
      },
      (err) => {
        console.error("Stream error:", err);
      }
    );
  }

  const handleUploadFiles = useCallback(
    (files: File[]) => {
      if (!activeWs || files.length === 0) return;
      setUploadQueue((n) => n + files.length);
      for (const file of files) {
        uploadDocumentMutation.mutate({ file, workspaceId: activeWs });
      }
    },
    [activeWs, uploadDocumentMutation]
  );

  const activeWsName = workspaces.find((w) => w.id === activeWs)?.name ?? "";
  const uploading = uploadQueue > 0;
  const creatingWs = createWorkspaceMutation.isPending;

  // When streaming, show persisted messages + a live "assistant" bubble
  const displayMessages: Array<
    TChatMessage | { id: string; role: "streaming" }
  > =
    is_streaming || streaming_text
      ? [
          ...persistedMessages,
          { id: "__streaming__", role: "streaming" } as const,
        ]
      : persistedMessages;

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            RAG Assistant
          </span>
          {workspaces.length > 0 && (
            <select
              value={activeWs ?? ""}
              onChange={(e) => setActiveWs(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          <form onSubmit={createWorkspace} className="flex items-center gap-1">
            <input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="New workspace…"
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              type="submit"
              disabled={creatingWs || !newWsName.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              + Create
            </button>
          </form>
        </div>
        <div className="flex items-center gap-2">
          {userAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userName}
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
            {userEmail}
          </span>
          <a
            href="/login"
            onClick={async (e) => {
              e.preventDefault();
              await fetch("/auth/signout", { method: "POST" }).catch(() => {});
              window.location.href = "/login";
            }}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign out
          </a>
        </div>
      </header>

      {workspaces.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500 dark:text-gray-400">
          <p className="text-lg">Create your first workspace to get started</p>
          <form onSubmit={createWorkspace} className="flex items-center gap-2">
            <input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="Workspace name…"
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={creatingWs || !newWsName.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Create workspace
            </button>
          </form>
        </div>
      )}

      {activeWs && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
            {(["chat", "documents", "tool-calls", "tasks"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {t === "tool-calls"
                    ? "Tool Calls"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                  {t === "tool-calls" && toolCalls.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {toolCalls.length}
                    </span>
                  )}
                  {t === "tasks" && taskList.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-green-100 px-1.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                      {taskList.length}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          {/* Chat tab */}
          {tab === "chat" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {docs.filter((d) => d.status === "ready").length === 0 && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  Upload documents in the Documents tab before chatting — the
                  assistant only answers from uploaded files.
                </div>
              )}

              {/* Stream error banner */}
              {stream_error && !is_streaming && (
                <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                  {stream_error}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {persistedMessages.length === 0 &&
                  !is_streaming &&
                  !streaming_text && (
                    <p className="text-center text-sm text-gray-400 mt-8">
                      Ask anything about the documents in{" "}
                      <strong>{activeWsName}</strong>
                    </p>
                  )}

                {/* Persisted messages */}
                {displayMessages.map((msg) => {
                  if ("role" in msg && msg.role === "streaming") {
                    return (
                      <StreamingBubble
                        key="__streaming__"
                        text={streaming_text}
                        status={status}
                        tool_calls={live_tool_calls}
                        is_streaming={is_streaming}
                      />
                    );
                  }

                  const m = msg as TChatMessage;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.role === "assistant" &&
                          m.citations &&
                          m.citations.length > 0 && (
                            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Sources:
                              </p>
                              {m.citations
                                .filter(
                                  (c, i, arr) =>
                                    arr.findIndex(
                                      (x) => x.filename === c.filename
                                    ) === i
                                )
                                .map((c) => (
                                  <span
                                    key={c.filename}
                                    className="mr-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                  >
                                    {c.filename}
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}

                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={sendMessage}
                className="flex gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask about documents in ${activeWsName}…`}
                  disabled={is_streaming}
                  className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {is_streaming ? (
                  <button
                    type="button"
                    onClick={abort}
                    className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Documents tab */}
          {tab === "documents" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-900">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Upload up to <strong>2 files</strong> of any type into{" "}
                    <strong>{activeWsName}</strong>. Files are stored in
                    Cloudflare R2; text-based files are chunked and embedded for
                    chat.
                  </p>
                  <DocumentDropzone
                    disabled={uploading}
                    onUpload={handleUploadFiles}
                  />
                  {uploading && (
                    <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
                      Uploading and processing… this may take a moment.
                    </p>
                  )}
                </div>

                {docs.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">
                    No documents yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {doc.filename}
                          </span>
                          {doc.storage_url && (
                            <a
                              href={doc.storage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              View
                            </a>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            doc.status === "ready"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : doc.status === "error"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Tool calls tab */}
          {tab === "tool-calls" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-3xl space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tool call log — {activeWsName}
                </h2>
                {toolCalls.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No tool calls yet. Ask the assistant to save a task or send
                    a Discord summary.
                  </p>
                ) : (
                  toolCalls.map((tc) => (
                    <div
                      key={tc.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {tc.tool_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            tc.status === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {tc.status}
                        </span>
                      </div>
                      <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        args: {JSON.stringify(tc.arguments, null, 2)}
                      </pre>
                      <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        result: {JSON.stringify(tc.result, null, 2)}
                      </pre>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(tc.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tasks tab */}
          {tab === "tasks" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-2xl space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tasks — {activeWsName}
                </h2>
                {taskList.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No tasks yet. Ask the assistant to &ldquo;save a task&rdquo;
                    and it will appear here.
                  </p>
                ) : (
                  taskList.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                            t.done
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                              {t.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(t.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StreamingBubble — live assistant bubble rendered during an active stream
// ---------------------------------------------------------------------------

type TStreamToolCall = { tool_name: string; arguments: unknown };

function StreamingBubble({
  text,
  status,
  tool_calls,
  is_streaming,
}: {
  text: string;
  status: string | null;
  tool_calls: TStreamToolCall[];
  is_streaming: boolean;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700">
        {/* Streaming text */}
        {text ? <p className="whitespace-pre-wrap">{text}</p> : null}

        {/* Status indicator */}
        {status && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:100ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:200ms]" />
            </span>
            {status}
          </span>
        )}

        {/* Show thinking dots when neither text nor status yet */}
        {!text && !status && is_streaming && (
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
          </span>
        )}

        {/* Live tool call chips */}
        {tool_calls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2 dark:border-gray-700">
            {tool_calls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {tc.tool_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
