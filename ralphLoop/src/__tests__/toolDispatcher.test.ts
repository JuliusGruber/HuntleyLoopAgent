import { describe, it, expect } from "vitest";
import { dispatch } from "../toolDispatcher.js";

describe("dispatch", () => {
  it("dispatches bash tool", () => {
    const result = dispatch("bash", { command: "echo hi" });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("hi");
  });

  it("dispatches list_files tool", () => {
    const result = dispatch("list_files", { path: "." });
    expect(result.isError).toBe(false);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("dispatches read_file tool", () => {
    const result = dispatch("read_file", { file_path: "package.json" });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("huntley-loop-agent");
  });

  it("dispatches write_file tool with missing path as error", () => {
    const result = dispatch("write_file", { file_path: "", content: "x" });
    expect(result.isError).toBe(true);
  });

  it("returns error for unknown tool", () => {
    const result = dispatch("nonexistent_tool", {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain("Unknown tool");
  });

  it("handles missing input fields with defaults", () => {
    const result = dispatch("bash", {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain("No command provided");
  });

  it("handles null/undefined input values safely", () => {
    const result = dispatch("read_file", { file_path: undefined });
    expect(result.isError).toBe(true);
  });

  it("list_files defaults to cwd when path not provided", () => {
    const result = dispatch("list_files", {});
    expect(result.isError).toBe(false);
    expect(result.content.length).toBeGreaterThan(0);
  });
});
