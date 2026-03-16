import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface WriteFileResult {
  content: string;
  isError: boolean;
}

export function writeFile(filePath: string, content: string): WriteFileResult {
  if (!filePath || filePath.trim() === "") {
    return { content: "Error: No file path provided.", isError: true };
  }

  try {
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, "utf-8");
    const bytes = Buffer.byteLength(content, "utf-8");
    return { content: `Wrote ${bytes} bytes to ${filePath}`, isError: false };
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return { content: `Error: Permission denied: '${filePath}'.`, isError: true };
    }
    if (isNodeError(err) && err.code === "ENOSPC") {
      return { content: `Error: Disk full, could not write to '${filePath}'.`, isError: true };
    }
    return { content: `Error: ${String(err)}`, isError: true };
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
