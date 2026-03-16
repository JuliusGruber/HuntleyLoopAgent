import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before importing the module under test
const mockStream = vi.fn();
vi.mock("../config.js", () => ({
  client: {
    messages: {
      stream: (...args: unknown[]) => mockStream(...args),
    },
  },
  model: "test-model",
}));

vi.mock("../tools.js", () => ({
  toolDefinitions: [],
}));

vi.mock("../systemPrompt.js", () => ({
  systemPrompt: "test system prompt",
}));

const mockDispatch = vi.fn();
vi.mock("../toolDispatcher.js", () => ({
  dispatch: (...args: unknown[]) => mockDispatch(...args),
}));

import { runAgentLoop } from "../agentLoop.js";

interface MockStreamObj {
  on: (...args: unknown[]) => MockStreamObj;
  finalMessage: () => Promise<Record<string, unknown>>;
}

function createMockStreamObj(response: Record<string, unknown>): MockStreamObj {
  const obj: MockStreamObj = {
    on: vi.fn().mockReturnThis() as unknown as MockStreamObj["on"],
    finalMessage: vi.fn().mockResolvedValue(response) as MockStreamObj["finalMessage"],
  };
  return obj;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("agentLoop", () => {
  let stdoutSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("completes on text-only response", async () => {
    const stream = createMockStreamObj({
      content: [{ type: "text", text: "Hello!" }],
    });
    mockStream.mockReturnValue(stream);

    const messages = [{ role: "user" as const, content: "hi" }];
    const result = await runAgentLoop(messages);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: "user", content: "hi" });
    expect(result[1]).toEqual({
      role: "assistant",
      content: [{ type: "text", text: "Hello!" }],
    });
    expect(mockStream).toHaveBeenCalledTimes(1);
  });

  it("completes on empty response", async () => {
    const stream = createMockStreamObj({ content: [] });
    mockStream.mockReturnValue(stream);

    const messages = [{ role: "user" as const, content: "hi" }];
    const result = await runAgentLoop(messages);

    // Empty response → loop exits without adding to history
    expect(result).toHaveLength(1);
    expect(mockStream).toHaveBeenCalledTimes(1);
  });

  it("dispatches tool use and continues loop", async () => {
    const toolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "ls" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Done!" }],
    });
    mockStream
      .mockReturnValueOnce(toolStream)
      .mockReturnValueOnce(textStream);

    mockDispatch.mockReturnValue({ content: "file1\nfile2", isError: false });

    const messages = [{ role: "user" as const, content: "list files" }];
    const result = await runAgentLoop(messages);

    expect(mockDispatch).toHaveBeenCalledWith("bash", { command: "ls" });
    expect(mockStream).toHaveBeenCalledTimes(2);

    // user, assistant(tool_use), user(tool_result), assistant(text)
    expect(result).toHaveLength(4);

    // Tool result should NOT have is_error when isError is false
    const toolResultMsg = result[2];
    expect(toolResultMsg.role).toBe("user");
    const toolResults = toolResultMsg.content as any[];
    expect(toolResults[0]).toEqual({
      type: "tool_result",
      tool_use_id: "tu_1",
      content: "file1\nfile2",
    });
  });

  it("dispatches multiple tool uses in single response", async () => {
    const multiToolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "ls" },
        },
        {
          type: "tool_use",
          id: "tu_2",
          name: "read_file",
          input: { file_path: "test.txt" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Done!" }],
    });
    mockStream
      .mockReturnValueOnce(multiToolStream)
      .mockReturnValueOnce(textStream);

    mockDispatch
      .mockReturnValueOnce({ content: "file1", isError: false })
      .mockReturnValueOnce({ content: "content", isError: false });

    const messages = [{ role: "user" as const, content: "do stuff" }];
    const result = await runAgentLoop(messages);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith("bash", { command: "ls" });
    expect(mockDispatch).toHaveBeenCalledWith("read_file", {
      file_path: "test.txt",
    });

    const toolResultMsg = result[2];
    const toolResults = toolResultMsg.content as any[];
    expect(toolResults).toHaveLength(2);
    expect(toolResults[0]).toMatchObject({ tool_use_id: "tu_1" });
    expect(toolResults[1]).toMatchObject({ tool_use_id: "tu_2" });
  });

  it("propagates isError flag from tool dispatch", async () => {
    const toolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "false" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Command failed" }],
    });
    mockStream
      .mockReturnValueOnce(toolStream)
      .mockReturnValueOnce(textStream);

    mockDispatch.mockReturnValue({
      content: "Error: exit code 1",
      isError: true,
    });

    const messages = [{ role: "user" as const, content: "run false" }];
    const result = await runAgentLoop(messages);

    const toolResultMsg = result[2];
    const toolResults = toolResultMsg.content as any[];
    expect(toolResults[0]).toEqual({
      type: "tool_result",
      tool_use_id: "tu_1",
      content: "Error: exit code 1",
      is_error: true,
    });
  });

  it("catches dispatch errors and sends as error tool result", async () => {
    const toolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "ls" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Error handled" }],
    });
    mockStream
      .mockReturnValueOnce(toolStream)
      .mockReturnValueOnce(textStream);

    mockDispatch.mockImplementation(() => {
      throw new Error("Unexpected crash");
    });

    const messages = [{ role: "user" as const, content: "crash" }];
    const result = await runAgentLoop(messages);

    const toolResultMsg = result[2];
    const toolResults = toolResultMsg.content as any[];
    expect(toolResults[0]).toMatchObject({
      is_error: true,
    });
    expect(toolResults[0].content).toContain("Internal error");
    expect(toolResults[0].content).toContain("Unexpected crash");
  });

  it("throws AbortError when signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const messages = [{ role: "user" as const, content: "hi" }];

    await expect(
      runAgentLoop(messages, controller.signal)
    ).rejects.toThrow("Aborted");

    expect(mockStream).not.toHaveBeenCalled();
  });

  it("throws AbortError when signal aborts between tool dispatches", async () => {
    const controller = new AbortController();

    const multiToolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "echo 1" },
        },
        {
          type: "tool_use",
          id: "tu_2",
          name: "bash",
          input: { command: "echo 2" },
        },
      ],
    });
    mockStream.mockReturnValue(multiToolStream);

    mockDispatch.mockImplementation(() => {
      controller.abort(); // Abort after first dispatch
      return { content: "ok", isError: false };
    });

    const messages = [{ role: "user" as const, content: "do two things" }];

    await expect(
      runAgentLoop(messages, controller.signal)
    ).rejects.toThrow("Aborted");

    // Only first tool should have been dispatched
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("does not modify the original messages array", async () => {
    const stream = createMockStreamObj({
      content: [{ type: "text", text: "Hello!" }],
    });
    mockStream.mockReturnValue(stream);

    const messages = [{ role: "user" as const, content: "hi" }];
    const result = await runAgentLoop(messages);

    expect(messages).toHaveLength(1); // Original unchanged
    expect(result).toHaveLength(2); // New array has both
    expect(result).not.toBe(messages); // Different reference
  });

  it("streams text to stdout via on('text') callback", async () => {
    const streamObj: MockStreamObj = {
      on: vi.fn((_event: unknown, callback: unknown) => {
        if (_event === "text" && typeof callback === "function") {
          (callback as (t: string) => void)("Hello ");
          (callback as (t: string) => void)("world!");
        }
        return streamObj;
      }) as unknown as MockStreamObj["on"],
      finalMessage: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Hello world!" }],
      }) as MockStreamObj["finalMessage"],
    };
    mockStream.mockReturnValue(streamObj);

    const messages = [{ role: "user" as const, content: "hi" }];
    await runAgentLoop(messages);

    expect(stdoutSpy).toHaveBeenCalledWith("Hello ");
    expect(stdoutSpy).toHaveBeenCalledWith("world!");
  });

  it("passes correct parameters to API stream call", async () => {
    const stream = createMockStreamObj({
      content: [{ type: "text", text: "ok" }],
    });
    mockStream.mockReturnValue(stream);

    const controller = new AbortController();
    const messages = [{ role: "user" as const, content: "test" }];
    await runAgentLoop(messages, controller.signal);

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "test-model",
        max_tokens: 8192,
        system: "test system prompt",
        tools: [],
      }),
      { signal: controller.signal }
    );
  });

  it("logs tool name, input, and result to console", async () => {
    const toolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "echo hi" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Done" }],
    });
    mockStream
      .mockReturnValueOnce(toolStream)
      .mockReturnValueOnce(textStream);

    mockDispatch.mockReturnValue({ content: "hi", isError: false });

    const messages = [{ role: "user" as const, content: "say hi" }];
    await runAgentLoop(messages);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Tool: bash]"),
      expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Result]"),
      "hi"
    );
  });

  it("truncates long tool results in log output", async () => {
    const toolStream = createMockStreamObj({
      content: [
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "cat big" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Done" }],
    });
    mockStream
      .mockReturnValueOnce(toolStream)
      .mockReturnValueOnce(textStream);

    const longContent = "x".repeat(1000);
    mockDispatch.mockReturnValue({ content: longContent, isError: false });

    const messages = [
      { role: "user" as const, content: "read big file" },
    ];
    await runAgentLoop(messages);

    // Result log should be truncated (500 chars + "...")
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Result]"),
      expect.stringMatching(/\.\.\.$/),
    );
  });

  it("handles mixed text and tool_use content blocks", async () => {
    const mixedStream = createMockStreamObj({
      content: [
        { type: "text", text: "Let me check..." },
        {
          type: "tool_use",
          id: "tu_1",
          name: "bash",
          input: { command: "ls" },
        },
      ],
    });
    const textStream = createMockStreamObj({
      content: [{ type: "text", text: "Done!" }],
    });
    mockStream
      .mockReturnValueOnce(mixedStream)
      .mockReturnValueOnce(textStream);

    mockDispatch.mockReturnValue({ content: "file1", isError: false });

    const messages = [{ role: "user" as const, content: "check" }];
    const result = await runAgentLoop(messages);

    // Tool should still be dispatched despite text block
    expect(mockDispatch).toHaveBeenCalledWith("bash", { command: "ls" });

    // Assistant message should contain both text and tool_use
    const assistantMsg = result[1];
    expect(assistantMsg.role).toBe("assistant");
    const blocks = assistantMsg.content as any[];
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "text" });
    expect(blocks[1]).toMatchObject({ type: "tool_use" });
  });
});
