# User Interaction

## Summary

The agent presents an interactive conversational CLI where the user types messages and the agent responds, maintaining context across turns.

## Context

The agent is a conversational coding assistant, similar to Claude Code. The user launches the agent and enters a REPL-style loop: they type a message, the agent works (calling tools as needed), displays its response, and waits for the next message. Conversation history is maintained across turns within a session.

## Acceptance Criteria

- The agent starts and displays a prompt, waiting for user input.
- The user types a message and presses Enter to send it.
- The agent streams the LLM's text responses to the terminal as they are generated (not buffered until the end).
- Tool invocations are visible to the user — the agent prints which tool is being called and with what parameters.
- Tool results are visible to the user — the agent prints the output returned by each tool.
- After the agent finishes responding, the prompt reappears for the next user message.
- The full conversation history (all user and assistant messages) is sent to the API on each turn, so the LLM has context from prior turns.
- The user can exit the session by typing "exit", "quit", or pressing Ctrl+C.
- If the API key is missing or invalid, the agent reports a clear error on startup before showing the prompt.

## Edge Cases

- The user sends an empty message (just presses Enter) — the agent ignores it and shows the prompt again.
- The user interrupts the agent mid-response (Ctrl+C) — the agent stops the current response and returns to the prompt (does not exit the session).
- A second Ctrl+C while at the prompt exits the session.
- Conversation grows beyond API context limits — the agent reports the error and continues the session (the user can start a new topic).

## Out of Scope

- Conversation persistence across sessions (history is lost when the agent exits).
- Rich terminal UI (colors, progress bars, spinners).
- Configuration files or command-line flags.
- Logging to files.
- Slash commands or special input syntax.
