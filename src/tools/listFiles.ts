import { readdirSync, statSync } from "node:fs";

export interface ListFilesResult {
  content: string;
  isError: boolean;
}

export function listFiles(path: string): ListFilesResult {
  const targetPath = !path || path.trim() === "" ? process.cwd() : path;

  try {
    const stat = statSync(targetPath);
    if (!stat.isDirectory()) {
      return { content: `Error: '${targetPath}' is not a directory.`, isError: true };
    }
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return { content: `Error: Path not found: '${targetPath}'.`, isError: true };
    }
    if (isNodeError(err) && err.code === "EACCES") {
      return { content: `Error: Permission denied: '${targetPath}'.`, isError: true };
    }
    return { content: `Error: ${String(err)}`, isError: true };
  }

  try {
    const entries = readdirSync(targetPath, { withFileTypes: true });

    if (entries.length === 0) {
      return { content: "Directory is empty.", isError: false };
    }

    const sorted = entries
      .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
      .sort();

    return { content: sorted.join("\n"), isError: false };
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return { content: `Error: Permission denied: '${targetPath}'.`, isError: true };
    }
    return { content: `Error: ${String(err)}`, isError: true };
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
