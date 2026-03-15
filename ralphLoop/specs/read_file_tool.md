# Read File Tool

## Summary

The read file tool returns the contents of a file at a given path.

## Context

The LLM needs to read existing source code, configuration files, and other project files to understand the codebase before making changes. This tool provides that capability with clear error reporting when files cannot be read.

## Acceptance Criteria

- The tool accepts a single parameter: the file path to read.
- The tool returns the full text contents of the file.
- If the file does not exist, the tool returns an error indicating the file was not found.
- If the path points to a directory rather than a file, the tool returns an error indicating the path is a directory, not a file.
- The tool reads files as UTF-8 text.

## Edge Cases

- The file is empty — the tool returns an empty string with no error.
- The file is very large — the tool truncates the content at a reasonable limit and indicates truncation occurred.
- The file path is empty — the tool returns an error indicating no path was provided.
- Permission denied on the file — the tool returns an error indicating insufficient permissions.
- The file contains binary (non-text) content — the tool returns the content as-is or returns an error indicating the file appears to be binary.

## Out of Scope

- Reading specific line ranges or byte offsets.
- Reading multiple files in a single call.
- Encoding detection or conversion beyond UTF-8.
