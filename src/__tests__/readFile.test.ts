import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile } from "../tools/readFile.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testDir = join(tmpdir(), `readfile-test-${Date.now()}`);

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, "hello.txt"), "Hello, world!");
  writeFileSync(join(testDir, "empty.txt"), "");
  writeFileSync(join(testDir, "binary.bin"), Buffer.from([0x00, 0x01, 0x02, 0xff]));
  mkdirSync(join(testDir, "adir"));
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("readFile", () => {
  it("reads a text file", () => {
    const result = readFile(join(testDir, "hello.txt"));
    expect(result.isError).toBe(false);
    expect(result.content).toBe("Hello, world!");
  });

  it("reads an empty file without error", () => {
    const result = readFile(join(testDir, "empty.txt"));
    expect(result.isError).toBe(false);
    expect(result.content).toBe("");
  });

  it("returns error for empty path", () => {
    const result = readFile("");
    expect(result.isError).toBe(true);
    expect(result.content).toContain("No file path provided");
  });

  it("returns error for non-existent file", () => {
    const result = readFile(join(testDir, "nope.txt"));
    expect(result.isError).toBe(true);
    expect(result.content).toContain("not found");
  });

  it("returns error for directory path", () => {
    const result = readFile(join(testDir, "adir"));
    expect(result.isError).toBe(true);
    expect(result.content).toContain("directory");
  });

  it("returns error for binary file", () => {
    const result = readFile(join(testDir, "binary.bin"));
    expect(result.isError).toBe(true);
    expect(result.content).toContain("binary");
  });

  it("truncates large files", () => {
    const largeFile = join(testDir, "large.txt");
    // Write 150KB of text
    writeFileSync(largeFile, "x".repeat(150 * 1024));
    const result = readFile(largeFile);
    expect(result.isError).toBe(false);
    expect(result.content).toContain("[file content truncated");
  });
});
