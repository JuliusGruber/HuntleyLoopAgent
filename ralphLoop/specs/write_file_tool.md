# Write File Tool

## Summary

The write file tool writes content to a file at a given path, creating or overwriting as needed.

## Context

The core purpose of a coding agent is to produce and modify code. The write file tool gives the LLM the ability to create new files and update existing ones, which is essential for implementing features, fixing bugs, and generating any file-based output.

## Acceptance Criteria

- The tool accepts two parameters: the file path and the content to write.
- The tool writes the provided content to the specified file path.
- If the file already exists, the tool overwrites it with the new content.
- If the file does not exist, the tool creates it.
- If intermediate directories in the path do not exist, the tool creates them.
- On success, the tool returns a confirmation indicating the file was written and the number of bytes written.
- The tool writes content as UTF-8 text.

## Edge Cases

- The file path is empty — the tool returns an error indicating no path was provided.
- The content is empty — the tool creates an empty file (this is valid).
- Permission denied on the target path — the tool returns an error indicating insufficient permissions.
- The disk is full or the write fails — the tool returns an error describing the failure.

## Out of Scope

- Partial file edits or patching (the tool always writes the complete file).
- File locking or concurrent write protection.
- Writing binary content.
- Backup or versioning of overwritten files.
