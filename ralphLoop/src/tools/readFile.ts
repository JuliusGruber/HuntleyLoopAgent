import { openSync, readSync, closeSync, readFileSync, statSync } from "node:fs";

const MAX_FILE_BYTES = 100 * 1024;

export interface ReadFileResult {
  content: string;
  isError: boolean;
}

function isBinary(buf: Buffer): boolean {
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

export function readFile(filePath: string): ReadFileResult {
  if (!filePath || filePath.trim() === "") {
    return { content: "Error: No file path provided.", isError: true };
  }

  let fileSize: number;
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      return { content: `Error: '${filePath}' is a directory, not a file.`, isError: true };
    }
    fileSize = stat.size;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return { content: `Error: File not found: '${filePath}'.`, isError: true };
    }
    if (isNodeError(err) && err.code === "EACCES") {
      return { content: `Error: Permission denied: '${filePath}'.`, isError: true };
    }
    return { content: `Error: ${String(err)}`, isError: true };
  }

  try {
    // Check for binary content by reading the first 8KB
    const probeSize = Math.min(fileSize, 8192);
    if (probeSize > 0) {
      const fd = openSync(filePath, "r");
      const probeBuf = Buffer.alloc(probeSize);
      readSync(fd, probeBuf, 0, probeSize, 0);
      closeSync(fd);
      if (isBinary(probeBuf)) {
        return { content: `Error: '${filePath}' appears to be a binary file.`, isError: true };
      }
    }

    // Read only up to the limit to avoid loading huge files into memory
    if (fileSize > MAX_FILE_BYTES) {
      const fd = openSync(filePath, "r");
      const buf = Buffer.alloc(MAX_FILE_BYTES);
      readSync(fd, buf, 0, MAX_FILE_BYTES, 0);
      closeSync(fd);
      return {
        content: buf.toString("utf-8") + "\n[file content truncated at 100KB]",
        isError: false,
      };
    }

    const content = readFileSync(filePath, "utf-8");
    return { content, isError: false };
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return { content: `Error: Permission denied: '${filePath}'.`, isError: true };
    }
    return { content: `Error: ${String(err)}`, isError: true };
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
