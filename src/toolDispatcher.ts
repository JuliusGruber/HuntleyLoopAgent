import { executeBash } from "./tools/bash.js";
import { listFiles } from "./tools/listFiles.js";
import { readFile } from "./tools/readFile.js";
import { writeFile } from "./tools/writeFile.js";

export interface DispatchResult {
  content: string;
  isError: boolean;
}

export function dispatch(
  toolName: string,
  input: Record<string, unknown>
): DispatchResult {
  switch (toolName) {
    case "bash":
      return executeBash(String(input.command ?? ""));
    case "list_files":
      return listFiles(String(input.path ?? ""));
    case "read_file":
      return readFile(String(input.file_path ?? ""));
    case "write_file":
      return writeFile(
        String(input.file_path ?? ""),
        input.content != null ? String(input.content) : ""
      );
    default:
      return { content: `Unknown tool: ${toolName}`, isError: true };
  }
}
