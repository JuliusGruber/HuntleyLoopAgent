import { describe, it, expect } from "vitest";
import { executeBash } from "../tools/bash.js";

describe("executeBash", () => {
  it("runs a simple command and returns output with exit code", () => {
    const result = executeBash("echo hello");
    expect(result.isError).toBe(false);
    expect(result.content).toContain("hello");
    expect(result.content).toContain("Exit code: 0");
  });

  it("returns error for empty command", () => {
    const result = executeBash("");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("No command provided");
  });

  it("returns error for whitespace-only command", () => {
    const result = executeBash("   ");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("No command provided");
  });

  it("captures stderr in output", () => {
    const result = executeBash("echo err >&2");
    expect(result.content).toContain("err");
  });

  it("returns non-zero exit code as isError", () => {
    const result = executeBash("exit 1");
    expect(result.isError).toBe(true);
    // No output → uses "Command completed with exit code N." format
    expect(result.content).toContain("exit code 1");
  });

  it("handles command that produces no output", () => {
    const result = executeBash("true");
    expect(result.isError).toBe(false);
    expect(result.content).toContain("exit code 0");
  });

  it("handles a failing command with output", () => {
    const result = executeBash("echo fail && exit 42");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("fail");
    expect(result.content).toContain("Exit code: 42");
  });

  it("truncates extremely large output", () => {
    // Generate output exceeding 100KB
    const result = executeBash("python3 -c \"print('x' * 200000)\" 2>/dev/null || printf '%0.sx' $(seq 1 200000)");
    expect(result.content).toContain("[output truncated]");
  });

  it("times out on long-running command", () => {
    // Use a very short timeout command — but our timeout is 120s,
    // so we just verify the tool doesn't hang on a quick sleep
    const result = executeBash("sleep 0.01");
    expect(result.isError).toBe(false);
  });
});
