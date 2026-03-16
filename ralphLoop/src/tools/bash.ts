import { spawnSync } from "node:child_process";

const TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 100 * 1024;

export function executeBash(command: string): string {
  if (!command || command.trim() === "") {
    return "Error: No command provided.";
  }

  const result = spawnSync(command, {
    shell: true,
    timeout: TIMEOUT_MS,
    cwd: process.cwd(),
    encoding: "utf-8",
    maxBuffer: MAX_OUTPUT_BYTES * 2,
  });

  if (result.error) {
    if (result.error.message.includes("ETIMEDOUT") || result.error.message.includes("timed out")) {
      return `Error: Command timed out after ${TIMEOUT_MS / 1000} seconds.`;
    }
    return `Error: ${result.error.message}`;
  }

  let output = (result.stdout ?? "") + (result.stderr ?? "");
  const exitCode = result.status ?? 1;

  if (output.length > MAX_OUTPUT_BYTES) {
    output = output.slice(0, MAX_OUTPUT_BYTES) + "\n[output truncated]";
  }

  if (output.trim() === "") {
    return `Command completed with exit code ${exitCode}.`;
  }

  return `${output}\n\nExit code: ${exitCode}`;
}
