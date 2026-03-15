# System Prompt

## Summary

The system prompt establishes the LLM's identity as a coding agent and defines the behavioral boundaries for its tool use.

## Context

The LLM has no inherent knowledge that it is operating as a coding agent with filesystem access. The system prompt is what bridges the gap between a general-purpose LLM and a focused coding assistant. Its content directly shapes how effectively the agent uses its tools, how it communicates progress, and whether it stays on task.

## Acceptance Criteria

- The system prompt tells the LLM it is a coding agent that helps users with programming tasks.
- The system prompt tells the LLM which tools are available and when to use each one.
- The system prompt instructs the LLM to use tools to explore the codebase before making changes rather than guessing at file contents or structure.
- The system prompt instructs the LLM to report what it is doing as it works so the user can follow along.
- The system prompt instructs the LLM to produce a final summary of what was accomplished when the task is complete.

## Edge Cases

- The user's task is unrelated to coding — the system prompt does not prevent the LLM from responding, but the tools available are oriented toward filesystem and shell operations.
- The system prompt combined with the user's task exceeds the model's context window — this is handled by the API returning an error (covered in Agent Loop).

## Out of Scope

- Dynamic or per-task system prompt customization.
- User-editable system prompt templates.
- Prompt engineering techniques or optimization of prompt wording.
