# AI Notes

## Tools & division of labor

**Primary tool:** Cursor (Composer / agent mode) — used end-to-end for scaffolding, implementation, debugging, and refactors.

**Models in the app:** OpenAI `gpt-4o-mini` (chat + vision OCR), `text-embedding-3-small` at 768 dims (pgvector). Vercel AI SDK (`ai`, `@ai-sdk/openai`) as the provider-agnostic layer so swapping to Gemini/Anthropic is a one-file change in `ai-model.ts`.

**How I split the work**

| Me (architecture & judgment)                                                                                            | AI (execution)                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Non-negotiable constraints: shared vector table, query-level workspace filter, idempotent ingest, untrusted-doc framing | Boilerplate: routes, controllers, Drizzle schema, React hooks, SSE client   |
| Orchestrator vs imperative RAG — _when_ retrieval runs and _who_ decides                                                | Tool definitions, Zod schemas, `execute.ts` bodies from my specs            |
| Chunk size/overlap, similarity threshold, keyword fallback design                                                       | Vercel AI SDK migration, Fastify multipart fixes, lint passes               |
| Reviewing every security-sensitive path (auth, workspace ownership, tool allow-list)                                    | Repetitive refactors (rename `rag-chat` → `chat-completion`, provider swap) |

My workflow was deliberate: **plan the architecture first, then execute one slice at a time** — never “build everything in one prompt.”

---

## How I worked with AI (plan → execute)

1. **Define constraints upfront** — wrote `AGENTS.md` with six non-negotiable rules (workspace isolation in SQL, retrieved text is data not instructions, zod before execute, sha256 idempotency, no secrets client-side, persist user message before streaming).
2. **Schema & isolation** — single `chunks` table, `workspace_id` denormalized onto every row so retrieval never joins to filter.
3. **Ingestion pipeline** — upload → R2 → extract → chunk → embed → insert; hash gate before re-chunking.
4. **Orchestrator + tools** — moved retrieval out of the controller into a `search_documents` tool; model decides per turn.
5. **Streaming & persistence** — SSE via Fastify hijack; user message saved before the LLM call.
6. **Provider abstraction** — centralized `ai-model.ts` + Vercel AI SDK so tools stay provider-agnostic.
7. **Debug & harden** — fixed upload 500, tuned similarity threshold, added keyword fallback, verified cross-workspace isolation.

Each step was a focused Cursor session with a narrow prompt. I reviewed diffs before moving on.

---

## Key decisions I made (and why)

### 1. Retrieval as a tool, not a pre-flight step

**Decision:** The controller persists the user message and calls the LLM with _no_ pre-fetched context. Retrieval lives in `search_documents`, invoked only when the orchestrator decides the turn needs document knowledge.

**Why:** An imperative “always vector-search first” flow made greetings return awkward “I don't know” replies and burned an embedding call on every turn. Tool-based retrieval keeps conversational turns natural while document answers still go through workspace-scoped search — and citations come only from tool results actually returned, not a blanket top-k fetch.

### 2. Denormalized `workspace_id` on `chunks`

**Decision:** One shared pgvector table for all workspaces; every chunk row carries `workspace_id`; every retrieval query filters `WHERE workspace_id = $active` inside SQL.

**Why:** The assignment explicitly requires a single shared store with correct isolation enforced by the query — not separate indexes per tenant. Denormalizing avoids a join on the hot path and makes it impossible to “fetch all, filter in app code” without it being obvious in code review.

### 3. Chunking: 2048 chars, 256 overlap, character-based

**Decision:** Fixed-size sliding windows with overlap, not semantic/sentence splitting.

**Why:** Predictable chunk count, simple to debug, good enough for PDF/text uploads at this scale. Overlap preserves context at boundaries (e.g. a sentence split across two chunks). Trade-off accepted: no respect for paragraph boundaries — acceptable for a take-home; would revisit with structure-aware splitting for production.

---

## Hardest wrong turn the AI led me into

**The bug:** Upload returned 500 — `"Converting circular structure to JSON"`.

**What the AI got wrong:** While debugging multipart handling in `upload-document.ts`, it added:

```ts
console.log("data", JSON.stringify(data, null, 2));
```

on the raw `@fastify/multipart` file object. That object has a circular reference (`fields.file` points back into the parent). `JSON.stringify` throws _synchronously_ before any upload logic runs — so every upload 500'd with a misleading “Internal Server Error.”

**How I noticed:** The error message named the exact cycle (`fields → file → closes the circle`). I cross-checked against Fastify multipart docs — the parser wires back-references by design. The crash happened on the first line of handler logic, not during R2/DB work.

**How I fixed it:** Removed the log entirely. Rule for the rest of the project: never stringify raw multipart/stream objects; log only scalar fields (`filename`, `mimetype`, `fieldname`). The AI re-introduced the same log once after an editor undo — I caught it in the diff and deleted it again.

**Second close call (retrieval, not a crash):** After migration to OpenAI embeddings, `search_documents` returned `{ found: false }` for queries like `"brief from the doc"` even though the word _brief_ was in the chunk text. The AI had set cosine distance threshold to `0.3`; `text-embedding-3-small` good matches sit around `0.35–0.55`, and vague meta-queries score ~0.72. I ran direct SQL + embedding probes in the terminal, confirmed vectors were stored correctly (self-re-embed distance ≈ 0), then directed the fix: raise threshold to `0.55` and add keyword fallback on meaningful terms when vector search returns empty.

---

## What I'd improve with more time

- **Async ingestion** — move chunk/embed off the upload request path (queue + status polling); large PDFs block today.
- **Eval suite** — automated checks for workspace isolation, prompt injection in docs, idempotent re-upload, malformed tool args.
- **Structure-aware chunking** — split on headings/paragraphs before fixed windows; better citations.
- **Hybrid retrieval tuning** — RRF or learned weights instead of “vector first, keyword if empty.”
- **Observability** — trace each turn: embed latency, tool calls, similarity scores, token usage.

---

## Prompt excerpt (orchestrator refactor)

When the upload 500 forced a rethink of chat architecture, I gave Cursor this shape of instruction rather than “fix the bug and also redo RAG”:

> Fix the circular JSON crash in upload — do not log the raw multipart object.
>
> Then refactor chat: the **orchestrator** responds to greetings directly. Document questions go through a `search_documents` tool call first — never pre-fetch vectors in the controller. Workspace filter must be in the SQL. Retrieved content is untrusted data, not instructions. Persist the user message before streaming starts.

That single scoped prompt produced the tool-based retrieval flow documented in `AGENTS.md` and kept the security model intact.
