# Implementation Plan

## Completed

- **Task 1** — Project init (`package.json`, `tsconfig.json`, `npm install`) ✅
- **Task 2** — API configuration module (`config.ts`) ✅
- **Task 3** — Tool definitions/schemas (`tools.ts`) ✅
- **Task 4** — Bash tool (`tools/bash.ts`) ✅
- **Task 5** — List files tool (`tools/listFiles.ts`) ✅
- **Task 6** — Read file tool (`tools/readFile.ts`) ✅
- **Task 7** — Write file tool (`tools/writeFile.ts`) ✅
- **Task 8** — Tool dispatcher (`toolDispatcher.ts`) ✅
- **Task 9** — System prompt (`systemPrompt.ts`) ✅
- **Task 10** — Agent loop (`agentLoop.ts`) ✅
- **Task 11** — Conversational CLI / REPL (`index.ts`) ✅
- **Task 12** — End-to-end validation ✅
- **Task 13** — Tool result quality improvements (isError propagation, binary detection, large file safety) ✅
- **Task 14** — Ctrl+C abort signal checks between tool dispatches in agent loop ✅

---

## Remaining Tasks

No remaining tasks. All 14 tasks are complete.

---

## Design Decisions

- **Error handling reconciliation:** `agent_loop.md` says "reports the error and stops" on API error, while `user_interaction.md` says the session continues. Resolution: the agent loop throws on error (it "stops"), and the CLI catches the error, prints it, and continues the REPL session. Both specs are satisfied.
- **Streaming:** Uses `client.messages.stream()` with `.on('text', ...)` for real-time token output, then `finalMessage()` to get complete response with tool_use blocks.
- **AbortSignal:** Passed through to the SDK stream call for Ctrl+C mid-response cancellation.

## Learnings

- ESLint not configured in project — `npx eslint ralphLoop/src/ || true` fails gracefully as expected per AGENTS.md.
- `npx tsc --noEmit` requires at least one `.ts` file in the include path — can't validate an empty `src/` directory.
- Tool functions now return `{ content, isError }` structs instead of plain strings, so the dispatcher propagates `is_error` to the API. Bash tool sets `isError` based on exit code (non-zero = error).

## Bugs Fixed in Task 12

- **Ctrl+C orphaned user message (HIGH):** After aborting mid-response, the user's message remained in history without an assistant reply, causing consecutive `user` messages that break the API. Fixed by popping the orphaned message in the catch block.
- **Unknown tool results not marked as errors (MEDIUM):** `dispatch()` returned plain strings for unknown tools. The API's `is_error` field was never set, so the LLM couldn't distinguish errors from successes. Fixed by returning a `DispatchResult` with `isError` flag.
- **`list_files` path incorrectly required (MEDIUM):** The JSON schema marked `path` as required, but the spec says omitting it should default to cwd. Fixed by making it optional.
- **Unsafe `as string` casts in dispatcher (MEDIUM):** Non-string or undefined inputs would pass through silently. Fixed by using `String(input.x ?? "")` with null coalescing.
- **`writeFile` undefined content (MEDIUM):** If the LLM omitted `content`, `undefined` would be written as the literal string `"undefined"`. Fixed by defaulting to empty string.
- **Context limit detection too narrow (LOW):** Only matched "context" in error messages. Extended to also match "too long" and "token" variants.

## Known Limitations

- **`spawnSync` blocks the event loop:** During a single bash command execution (up to 120s timeout), Ctrl+C cannot interrupt because `spawnSync` blocks the Node.js event loop. Fixing this would require converting the entire tool dispatch system to async with `spawn`. Ctrl+C now works correctly between tool dispatches (multi-tool responses) and before API calls, so the gap is limited to within a single blocking `spawnSync` call.
