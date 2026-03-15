# List Files Tool

## Summary

The list files tool returns the listing of files and directories at a given path.

## Context

Before reading or writing files, the LLM needs to discover what files exist and how the project is structured. This tool gives the agent visibility into the filesystem without needing to shell out to `ls`, keeping the interaction clean and predictable.

## Acceptance Criteria

- The tool accepts a single parameter: the directory path to list.
- The tool returns a list of file and directory names contained in the specified directory.
- Directories are visually distinguishable from files in the output (e.g., trailing slash or explicit label).
- If the path points to a file rather than a directory, the tool returns an error indicating the path is not a directory.
- If the directory does not exist, the tool returns an error indicating the path was not found.
- If the directory is empty, the tool returns an indication that the directory contains no entries.

## Edge Cases

- The path parameter is empty — the tool defaults to the agent's working directory.
- The directory contains a very large number of entries — the tool returns all entries (no pagination required for a minimal agent).
- Permission denied on the directory — the tool returns an error indicating insufficient permissions.

## Out of Scope

- Recursive listing of subdirectories.
- Glob or pattern filtering.
- File metadata (size, modification time, permissions).
