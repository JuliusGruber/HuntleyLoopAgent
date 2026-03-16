import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function writeFile(filePath: string, content: string): string {
  if (!filePath || filePath.trim() === "") {
    return "Error: No file path provided.";
  }

  try {
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, "utf-8");
    const bytes = Buffer.byteLength(content, "utf-8");
    return `Wrote ${bytes} bytes to ${filePath}`;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return `Error: Permission denied: '${filePath}'.`;
    }
    if (isNodeError(err) && err.code === "ENOSPC") {
      return `Error: Disk full, could not write to '${filePath}'.`;
    }
    return `Error: ${String(err)}`;
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
