# Agent Loop

## Summary

The agent runs a conversational loop with the LLM, sending messages and processing tool-use responses until the task is complete.

## Context

The agent loop is the central orchestrator of the coding agent. It manages the back-and-forth between the user's task and the LLM, handling tool calls as they arise and feeding results back into the conversation. Without a working loop, no tools can be invoked and no work can be done.

## Acceptance Criteria

- The agent sends the user's task to the Anthropic API as the initial message.
- When the LLM responds with a tool-use request, the agent executes the requested tool and sends the result back to the LLM as a tool-result message.
- When the LLM responds with multiple tool-use requests in a single response, the agent executes each one and sends all results back.
- The loop continues until the LLM responds with a final text message that contains no tool-use requests.
- When the loop ends, the agent outputs the LLM's final text response.
- The agent includes all four tools (bash, list files, read file, write file) in the tool definitions sent to the API.
- The system prompt instructs the LLM that it is a coding agent with access to these four tools.
- If the API returns an error, the agent reports the error and stops.

## Edge Cases

- The LLM returns an empty response with no text and no tool use — the agent treats this as loop completion.
- The API rate-limits or returns a transient error — the agent reports the error and exits (no retry logic required for a minimal agent).
- The LLM requests a tool that is not one of the four defined tools — the agent returns an error result for that tool call indicating the tool is unknown.

## Out of Scope

- Multi-turn conversation memory beyond a single task session.
- Retry or backoff logic for transient API failures.
- Streaming of partial LLM responses (streaming is covered in User Interaction).
- The internal behavior of individual tools (each has its own spec).
