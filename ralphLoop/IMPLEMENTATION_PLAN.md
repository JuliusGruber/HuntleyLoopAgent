# Implementation Plan

## Gap Analysis

**State of the codebase (verified 2026-03-15):** Fully greenfield. No `package.json`, `tsconfig.json`, or source files exist. The `ralphLoop/src/` directory does not exist. The only artifacts are:

- `loop.sh` — outer orchestration script (invokes Claude CLI; not part of the agent itself)
- `AGENTS.md` — project conventions (TypeScript, Anthropic SDK, one concern per file, source in `ralphLoop/src/`)
- `JTBD.md` — goal statement ("most minimal coding agent, four tools, TypeScript, Anthropic SDK")
- `specs/` — 8 specification files (4 tools, 3 infrastructure, 1 UI)
- `PROMPT_*.md` — prompts for `loop.sh`

**What is fully implemented:** Nothing.
**What is partially implemented:** Nothing.
**What is inconsistent with specs:** Nothing (no code exists).

---

## Task List

### 1. Initialize npm project and TypeScript configuration

**Why:** Root of the dependency tree. Every other task requires a working project skeleton to compile and run. Nothing can be built without `package.json` and `tsconfig.json`.

**What:**
- Create `package.json` at repo root with:
  - `"type": "module"`
  - Dependencies: `@anthropic-ai/sdk`
  - Dev dependencies: `typescript`, `tsx`, `@types/node`
- Create `tsconfig.json` at repo root:
  - `strict: true`
  - `target: "ESNext"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`
  - `include: ["ralphLoop/src/"]`
  - `outDir: "dist"`
- Create empty `ralphLoop/src/` directory
- Run `npm install`
- Run `npx tsc --noEmit` (should pass with zero files)

**Done when:** `npm install` succeeds, `npx tsc --noEmit` passes, `@anthropic-ai/sdk` is in `node_modules/`.

**Dependencies:** None.

---

### 2. Implement API configuration module

**Why:** The agent loop and every API call depend on a configured, authenticated client. Must exist before any API interaction. Spec: `api_configuration.md`.

**What:**
- Create `ralphLoop/src/config.ts`
- Read `ANTHROPIC_API_KEY` from `process.env`; if missing or empty, print clear error and call `process.exit(1)` before any API call
- Read `ANTHROPIC_MODEL` from `process.env`; default to `claude-sonnet-4-20250514`
- Instantiate and export `Anthropic` client with the API key
- Export model name string
- Export `validateAuth()` function that makes a lightweight API call (e.g., a minimal `messages.create` with `max_tokens: 1`); on failure, print the API error message and exit

**Done when:** Module exports working client and model. Missing/empty key prints clear error and exits. Invalid/revoked key prints API error and exits. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 3. Implement tool definitions (schemas only)

**Why:** The agent loop sends tool definitions to the API. This is pure data — no execution logic. Separating schemas from implementations follows "one concern per file." Specs: all 4 tool specs for parameter shapes.

**What:**
- Create `ralphLoop/src/tools.ts`
- Define and export `Anthropic.Tool[]` array with 4 entries:
  - `bash` — param: `command` (string, required)
  - `list_files` — param: `path` (string, required)
  - `read_file` — param: `file_path` (string, required)
  - `write_file` — params: `file_path` (string, required), `content` (string, required)
- Each entry has `name`, `description`, and `input_schema` (JSON Schema object)

**Done when:** Exports array of 4 tool definitions matching spec parameters. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 4. Implement the bash tool

**Why:** Most general-purpose tool. The agent uses it to compile, test, install, and inspect. Spec: `bash_tool.md`.

**What:**
- Create `ralphLoop/src/tools/bash.ts`
- Export function: `executeBash(command: string): string`
- Execute via `child_process.spawnSync` (or `execSync`) with:
  - `shell: true`
  - `timeout: 120_000` (120 seconds)
  - `cwd: process.cwd()`
- Return combined stdout + stderr as string, plus exit code
- Edge cases:
  - Empty command → return error string "No command provided"
  - Timeout → return error string indicating timeout
  - Large output (>100 KB) → truncate and append "[output truncated]"
  - Non-zero exit code → return output + exit code (not an exception)
  - No output → return "Command completed" + exit code

**Done when:** All 6 acceptance criteria and 3 edge cases from spec are met. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 5. Implement the list files tool

**Why:** Lets agent explore project structure before making changes. Spec: `list_files_tool.md`.

**What:**
- Create `ralphLoop/src/tools/listFiles.ts`
- Export function: `listFiles(path: string): string`
- Use `fs.readdirSync` with `{ withFileTypes: true }`
- Directories get trailing `/` in output; sorted alphabetically
- Edge cases:
  - Empty path → default to `process.cwd()`
  - Path is a file, not directory → return error string
  - Path not found → return error string
  - Empty directory → return "Directory is empty" message
  - Permission denied → return error string

**Done when:** All 6 acceptance criteria and 3 edge cases from spec are met. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 6. Implement the read file tool

**Why:** Agent must read source code before making changes — "explore before modifying." Spec: `read_file_tool.md`.

**What:**
- Create `ralphLoop/src/tools/readFile.ts`
- Export function: `readFile(filePath: string): string`
- Read file as UTF-8 via `fs.readFileSync`
- Edge cases:
  - Empty path → return error string
  - Path is directory → return error string "path is a directory, not a file"
  - Not found → return error string
  - Permission denied → return error string
  - Empty file → return empty string (no error)
  - Large file (>100 KB) → truncate and indicate truncation
  - Binary content → return error or content as-is (spec allows either; prefer error for safety)

**Done when:** All 5 acceptance criteria and 6 edge cases from spec are met. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 7. Implement the write file tool

**Why:** Agent produces code by writing files — the primary output mechanism. Spec: `write_file_tool.md`.

**What:**
- Create `ralphLoop/src/tools/writeFile.ts`
- Export function: `writeFile(filePath: string, content: string): string`
- Create intermediate directories with `fs.mkdirSync(dir, { recursive: true })`
- Write UTF-8 via `fs.writeFileSync`
- Return confirmation: `"Wrote <N> bytes to <path>"`
- Edge cases:
  - Empty path → return error string
  - Empty content → create empty file (valid per spec)
  - Permission denied → return error string
  - Disk full / write failure → return error string

**Done when:** All 7 acceptance criteria and 4 edge cases from spec are met. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 8. Implement tool dispatcher

**Why:** Single entry point routing tool calls to implementations. Keeps the agent loop clean — it calls `dispatch()` without knowing tool internals. Follows "one concern per file."

**What:**
- Create `ralphLoop/src/toolDispatcher.ts`
- Export function: `dispatch(toolName: string, input: Record<string, unknown>): string`
- Route by name:
  - `"bash"` → `executeBash(input.command)`
  - `"list_files"` → `listFiles(input.path)`
  - `"read_file"` → `readFile(input.file_path)`
  - `"write_file"` → `writeFile(input.file_path, input.content)`
- Unknown tool name → return `"Unknown tool: <name>"` (per agent_loop.md edge case)

**Done when:** Routes all 4 tools correctly. Unknown names return error string. `npx tsc --noEmit` passes.

**Dependencies:** Tasks 4, 5, 6, 7.

---

### 9. Implement system prompt

**Why:** Without the system prompt, the LLM doesn't know it's a coding agent or what tools it has. Spec: `system_prompt.md`.

**What:**
- Create `ralphLoop/src/systemPrompt.ts`
- Export a string constant covering all 5 acceptance criteria:
  1. Tells LLM it is a coding agent that helps users with programming tasks
  2. Lists the 4 tools (`bash`, `list_files`, `read_file`, `write_file`) and when to use each
  3. Instructs to explore codebase before making changes (read/list before write)
  4. Instructs to report what it's doing as it works (think aloud)
  5. Instructs to produce a final summary when the task is complete
- Keep concise. No prompt engineering optimization (out of scope per spec).

**Done when:** System prompt text covers all 5 criteria. `npx tsc --noEmit` passes.

**Dependencies:** Task 1.

---

### 10. Implement the agent loop

**Why:** Core orchestrator — the multi-turn tool-use conversation between user message and LLM. This is the heart of the agent. Spec: `agent_loop.md`, with streaming from `user_interaction.md`.

**What:**
- Create `ralphLoop/src/agentLoop.ts`
- Export async function: `runAgentLoop(messages: Message[], signal?: AbortSignal): Promise<Message[]>`
- Use Anthropic SDK streaming: `client.messages.stream()` with system prompt, tools, model, `max_tokens: 8192`, and message history
- Stream text tokens to stdout as they arrive (acceptance criteria 3 of `user_interaction.md`)
- Collect `tool_use` content blocks; after full response completes:
  - Print tool name + parameters to stdout (acceptance criteria 4 of `user_interaction.md`)
  - Execute via dispatcher
  - Print tool result to stdout (acceptance criteria 5 of `user_interaction.md`)
  - Construct `tool_result` messages, append to conversation history, loop back to API
- Handle multiple `tool_use` blocks in a single response (execute each, send all results back)
- Loop terminates when: response has text only (no tool_use blocks), or response is empty (no content blocks)
- On API error: throw the error (agent loop "stops"; CLI catches and continues session)
- Accept optional `AbortSignal` for mid-stream cancellation (for Ctrl+C support in CLI)
- Return the updated messages array so CLI can maintain history

**Done when:** Multi-turn tool use works. Text streams token-by-token. Tool calls and results are printed. Multiple tool_use blocks handled. Loop terminates correctly on text-only or empty response. API errors propagate. AbortSignal cancellation works. `npx tsc --noEmit` passes.

**Dependencies:** Tasks 2, 3, 8, 9.

---

### 11. Implement user interaction (conversational CLI)

**Why:** User-facing entry point — the REPL that wraps the agent loop. Spec: `user_interaction.md`.

**What:**
- Create `ralphLoop/src/index.ts`
- On startup:
  - Call `validateAuth()` — exits if API key missing/invalid (acceptance criteria 9)
  - Display input prompt
- REPL via `readline` (or `readline/promises`):
  - Empty input → ignore, re-prompt (edge case 1)
  - `"exit"` or `"quit"` → `process.exit(0)` (acceptance criteria 8)
  - Otherwise → append user message to conversation history, call `runAgentLoop()`, re-prompt
- Maintain full conversation history array across turns (acceptance criteria 7)
- Ctrl+C handling:
  - Mid-response (agent is streaming) → abort via `AbortController`, stop current response, return to prompt (edge case 2)
  - At prompt (waiting for input) → exit session (edge case 3; "second Ctrl+C")
- Context-limit API error → print friendly message, continue session (edge case 4)
- Other API errors → print error, continue session

**Done when:** Full REPL works: auth validation on startup, streaming responses, tool calls/results visible, history persists across turns, exit/quit work, Ctrl+C mid-response returns to prompt, Ctrl+C at prompt exits, API errors handled gracefully. `npx tsc --noEmit` passes.

**Dependencies:** Task 10.

---

### 12. End-to-end validation

**Why:** Integration test — all pieces working together as a real agent. Catches issues not visible when building modules individually.

**What:**
- `npx tsc --noEmit` passes with zero errors
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

**Dependencies:** Task 11.

---

## Dependency Graph

```
Task 1 (project init)
  ├── Task 2 (API config) ──────────────────┐
  ├── Task 3 (tool schemas) ────────────────┤
  ├── Task 4 (bash tool) ──────┐            │
  ├── Task 5 (list files tool) ┤            │
  ├── Task 6 (read file tool)  ├─ Task 8    │
  ├── Task 7 (write file tool) ┘ (dispatch) │
  └── Task 9 (system prompt) ───────────────┤
                                            │
                                  Task 10 (agent loop)
                                            │
                                  Task 11 (CLI / REPL)
                                            │
                                  Task 12 (E2E validation)
```

## Prioritization Reasoning

**Layer 1 — Foundation (Task 1):** Root dependency. No code can be written, compiled, or run without `package.json` and `tsconfig.json`. This is the only task with zero dependencies.

**Layer 2 — Independent modules (Tasks 2–7, 9):** These seven tasks have no dependencies on each other; they can be built in any order (or in parallel) after Task 1. They are ordered by how early they unblock downstream work:
- Tasks 2 & 3 → needed by agent loop (Task 10)
- Tasks 4–7 → needed by dispatcher (Task 8)
- Task 9 → needed by agent loop (Task 10)

**Layer 3 — Integration (Tasks 8, 10):** The dispatcher (Task 8) depends on all 4 tool implementations. The agent loop (Task 10) depends on the dispatcher, config, schemas, and system prompt — it is the most complex single task and the core of the agent.

**Layer 4 — User interface (Task 11):** Wraps the agent loop in a REPL. Placed after the loop because it's a thin wrapper — getting the loop correct first means the CLI only handles I/O and signals.

**Layer 5 — Validation (Task 12):** Final integration check. Must come last since it tests the assembled system.

**Design decisions:**
- **Tools before dispatcher:** Each tool is independently testable and has its own spec. The dispatcher is trivial routing once tools exist.
- **Agent loop as single task:** Streaming, tool handling, and loop control are deeply interleaved in one function — splitting would create artificial boundaries and harder-to-test partial states.
- **CLI last:** It's the thinnest layer. Getting the loop right first means the CLI only needs to handle readline, signals, and error display.
- **Spec reconciliation (error handling):** `agent_loop.md` says "reports the error and stops" on API error, while `user_interaction.md` says the session continues. Resolution: the agent loop throws on error (it "stops"), and the CLI catches the error, prints it, and continues the REPL session. Both specs are satisfied without contradiction.
