# User Interaction

## Summary

The user provides a task via the command line and the agent streams its work to the terminal.

## Context

The agent needs a way to receive work from the user and show progress as it operates. Since this is a minimal agent, the interface is a simple command-line program — no GUI, no web server, no REPL. The user runs the agent with a task and watches it work.

## Acceptance Criteria

- The agent accepts the user's task as a command-line argument or via standard input.
- The agent streams the LLM's text responses to the terminal as they are generated (not buffered until the end).
- Tool invocations are visible to the user — the agent prints which tool is being called and with what parameters.
- Tool results are visible to the user — the agent prints the output returned by each tool.
- When the agent finishes, the final response from the LLM is clearly presented.
- If no task is provided, the agent prints a usage message and exits.

## Edge Cases

- The user provides an extremely long task string — the agent passes it to the API as-is (the API will reject if it exceeds limits).
- The user interrupts the agent (e.g., Ctrl+C) — the agent exits cleanly without leaving orphan processes.
- The API key is missing or invalid — the agent reports a clear error before starting the loop.

## Out of Scope

- Interactive multi-turn conversation (the agent handles one task per invocation).
- Rich terminal UI (colors, progress bars, spinners).
- Configuration files or command-line flags beyond the task input.
- Logging to files.
