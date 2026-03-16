import { spawnSync } from "node:child_process";

const TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 100 * 1024;

export interface BashResult {
  content: string;
  isError: boolean;
}

export function executeBash(command: string): BashResult {
  if (!command || command.trim() === "") {
    return { content: "Error: No command provided.", isError: true };
  }

  const result = spawnSync(command, {
    shell: true,
    timeout: TIMEOUT_MS,
    cwd: process.cwd(),
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024, // 10MB — let string truncation at MAX_OUTPUT_BYTES be the effective limit
  });

  if (result.error) {
    if (result.error.message.includes("ETIMEDOUT") || result.error.message.includes("timed out")) {
      return { content: `Error: Command timed out after ${TIMEOUT_MS / 1000} seconds.`, isError: true };
    }
    return { content: `Error: ${result.error.message}`, isError: true };
  }

  let output = (result.stdout ?? "") + (result.stderr ?? "");
  const exitCode = result.status ?? 1;

  if (output.length > MAX_OUTPUT_BYTES) {
    output = output.slice(0, MAX_OUTPUT_BYTES) + "\n[output truncated]";
  }

  if (output.trim() === "") {
    return { content: `Command completed with exit code ${exitCode}.`, isError: exitCode !== 0 };
  }

  return { content: `${output}\n\nExit code: ${exitCode}`, isError: exitCode !== 0 };
}
