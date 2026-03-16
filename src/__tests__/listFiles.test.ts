import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { listFiles } from "../tools/listFiles.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testDir = join(tmpdir(), `listfiles-test-${Date.now()}`);

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "subdir"));
  writeFileSync(join(testDir, "file.txt"), "hello");
  writeFileSync(join(testDir, "another.ts"), "code");
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("listFiles", () => {
  it("lists files and directories with trailing slash on dirs", () => {
    const result = listFiles(testDir);
    expect(result.isError).toBe(false);
    expect(result.content).toContain("subdir/");
    expect(result.content).toContain("file.txt");
    expect(result.content).toContain("another.ts");
  });

  it("defaults to cwd when path is empty", () => {
    const result = listFiles("");
    expect(result.isError).toBe(false);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("returns error for non-existent path", () => {
    const result = listFiles("/nonexistent/path/xyz");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("not found");
  });

  it("returns error when path is a file", () => {
    const result = listFiles(join(testDir, "file.txt"));
    expect(result.isError).toBe(true);
    expect(result.content).toContain("not a directory");
  });

  it("handles empty directory", () => {
    const emptyDir = join(testDir, "empty");
    mkdirSync(emptyDir, { recursive: true });
    const result = listFiles(emptyDir);
    expect(result.isError).toBe(false);
    expect(result.content).toContain("empty");
  });
});
