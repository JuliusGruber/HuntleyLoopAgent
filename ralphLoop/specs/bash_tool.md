# Bash Tool

## Summary

The bash tool executes a shell command provided by the LLM and returns the combined output.

## Context

A coding agent needs the ability to run arbitrary shell commands to compile code, run tests, install dependencies, inspect system state, and perform any action available from the command line. This is the most general-purpose tool in the agent's toolkit.

## Acceptance Criteria

- The tool accepts a single parameter: the command string to execute.
- The tool executes the command using the system's shell.
- The tool returns the combined standard output and standard error as the tool result.
- The tool returns the exit code of the command as part of the result so the LLM can determine success or failure.
- If the command produces no output, the tool returns an indication that the command completed along with the exit code.
- The tool executes commands in the working directory where the agent was started.

## Edge Cases

- The command hangs or runs indefinitely — the tool enforces a timeout (e.g., 120 seconds) and returns an error indicating the command timed out.
- The command produces extremely large output — the tool truncates the output at a reasonable limit and indicates truncation occurred.
- The command string is empty — the tool returns an error indicating no command was provided.

## Out of Scope

- Sandboxing or restricting which commands can be run.
- Interactive commands that require user input (stdin).
- Maintaining shell state (environment variables, working directory changes) across separate tool invocations.
