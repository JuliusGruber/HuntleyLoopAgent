import { readFileSync, statSync } from "node:fs";

const MAX_FILE_BYTES = 100 * 1024;

export function readFile(filePath: string): string {
  if (!filePath || filePath.trim() === "") {
    return "Error: No file path provided.";
  }

  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      return `Error: '${filePath}' is a directory, not a file.`;
    }
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return `Error: File not found: '${filePath}'.`;
    }
    if (isNodeError(err) && err.code === "EACCES") {
      return `Error: Permission denied: '${filePath}'.`;
    }
    return `Error: ${String(err)}`;
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    if (content.length > MAX_FILE_BYTES) {
      return (
        content.slice(0, MAX_FILE_BYTES) +
        "\n[file content truncated at 100KB]"
      );
    }

    return content;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return `Error: Permission denied: '${filePath}'.`;
    }
    return `Error: ${String(err)}`;
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
