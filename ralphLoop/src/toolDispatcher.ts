import { executeBash } from "./tools/bash.js";
import { listFiles } from "./tools/listFiles.js";
import { readFile } from "./tools/readFile.js";
import { writeFile } from "./tools/writeFile.js";

export function dispatch(
  toolName: string,
  input: Record<string, unknown>
): string {
  switch (toolName) {
    case "bash":
      return executeBash(input.command as string);
    case "list_files":
      return listFiles(input.path as string);
    case "read_file":
      return readFile(input.file_path as string);
    case "write_file":
      return writeFile(
        input.file_path as string,
        input.content as string
      );
    default:
      return `Unknown tool: ${toolName}`;
  }
}
