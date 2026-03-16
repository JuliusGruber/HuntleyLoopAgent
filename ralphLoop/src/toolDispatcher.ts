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
      return { content: executeBash(String(input.command ?? "")), isError: false };
    case "list_files":
      return { content: listFiles(String(input.path ?? "")), isError: false };
    case "read_file":
      return { content: readFile(String(input.file_path ?? "")), isError: false };
    case "write_file":
      return {
        content: writeFile(
          String(input.file_path ?? ""),
          input.content != null ? String(input.content) : ""
        ),
        isError: false,
      };
    default:
      return { content: `Unknown tool: ${toolName}`, isError: true };
  }
}
