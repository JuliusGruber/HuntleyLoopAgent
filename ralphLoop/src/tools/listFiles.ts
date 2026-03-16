import { readdirSync, statSync } from "node:fs";

export function listFiles(path: string): string {
  const targetPath = !path || path.trim() === "" ? process.cwd() : path;

  try {
    const stat = statSync(targetPath);
    if (!stat.isDirectory()) {
      return `Error: '${targetPath}' is not a directory.`;
    }
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return `Error: Path not found: '${targetPath}'.`;
    }
    if (isNodeError(err) && err.code === "EACCES") {
      return `Error: Permission denied: '${targetPath}'.`;
    }
    return `Error: ${String(err)}`;
  }

  try {
    const entries = readdirSync(targetPath, { withFileTypes: true });

    if (entries.length === 0) {
      return "Directory is empty.";
    }

    const sorted = entries
      .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
      .sort();

    return sorted.join("\n");
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "EACCES") {
      return `Error: Permission denied: '${targetPath}'.`;
    }
    return `Error: ${String(err)}`;
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
