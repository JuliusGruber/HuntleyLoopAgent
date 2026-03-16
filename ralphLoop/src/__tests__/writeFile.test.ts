import { describe, it, expect, afterAll } from "vitest";
import { writeFile } from "../tools/writeFile.js";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testDir = join(tmpdir(), `writefile-test-${Date.now()}`);

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("writeFile", () => {
  it("creates a new file with content", () => {
    const filePath = join(testDir, "new.txt");
    const result = writeFile(filePath, "hello world");
    expect(result.isError).toBe(false);
    expect(result.content).toContain("11 bytes");
    expect(readFileSync(filePath, "utf-8")).toBe("hello world");
  });

  it("overwrites an existing file", () => {
    const filePath = join(testDir, "new.txt");
    const result = writeFile(filePath, "overwritten");
    expect(result.isError).toBe(false);
    expect(readFileSync(filePath, "utf-8")).toBe("overwritten");
  });

  it("creates intermediate directories", () => {
    const filePath = join(testDir, "deep", "nested", "file.txt");
    const result = writeFile(filePath, "nested content");
    expect(result.isError).toBe(false);
    expect(readFileSync(filePath, "utf-8")).toBe("nested content");
  });

  it("creates an empty file when content is empty", () => {
    const filePath = join(testDir, "empty.txt");
    const result = writeFile(filePath, "");
    expect(result.isError).toBe(false);
    expect(result.content).toContain("0 bytes");
    expect(readFileSync(filePath, "utf-8")).toBe("");
  });

  it("returns error for empty path", () => {
    const result = writeFile("", "content");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("No file path provided");
  });
});
