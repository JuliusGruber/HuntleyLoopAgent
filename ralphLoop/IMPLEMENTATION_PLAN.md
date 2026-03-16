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

---

## Remaining Tasks

### 12. End-to-end validation

**Why:** Integration test — all pieces working together as a real agent. Catches issues not visible when building modules individually.

**What:**
- `npx tsc --noEmit` passes with zero errors ✅ (verified)
- `npx tsx ralphLoop/src/index.ts` starts and validates auth
- Agent displays prompt and waits for input
- Send a message → streamed text response appears token-by-token
- Send a task requiring tools → tool name/params printed → results printed → conversation continues
- Multiple tool calls in one response handled correctly
- Empty input ignored, prompt reappears
- `"exit"` exits cleanly
- `"quit"` exits cleanly
- Ctrl+C mid-response returns to prompt
- Ctrl+C at prompt exits
- Conversation context maintained across turns (agent remembers prior messages)
- Fix any issues discovered

**Done when:** All verifications above pass. The agent handles multi-turn conversation with tool use and exits cleanly via all methods.

**Dependencies:** Task 11 (done).

---

## Dependency Graph

```
Task 1–11: ALL DONE ✅
  └── Task 12 (E2E validation) — NEXT
```

## Design Decisions

- **Error handling reconciliation:** `agent_loop.md` says "reports the error and stops" on API error, while `user_interaction.md` says the session continues. Resolution: the agent loop throws on error (it "stops"), and the CLI catches the error, prints it, and continues the REPL session. Both specs are satisfied.
- **Streaming:** Uses `client.messages.stream()` with `.on('text', ...)` for real-time token output, then `finalMessage()` to get complete response with tool_use blocks.
- **AbortSignal:** Passed through to the SDK stream call for Ctrl+C mid-response cancellation.

## Learnings

- ESLint not configured in project — `npx eslint ralphLoop/src/ || true` fails gracefully as expected per AGENTS.md.
- `npx tsc --noEmit` requires at least one `.ts` file in the include path — can't validate an empty `src/` directory.
