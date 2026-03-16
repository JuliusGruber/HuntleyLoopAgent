import Anthropic from "@anthropic-ai/sdk";
import { client, model } from "./config.js";
import { toolDefinitions } from "./tools.js";
import { systemPrompt } from "./systemPrompt.js";
import { dispatch } from "./toolDispatcher.js";

type Message = Anthropic.MessageParam;

export async function runAgentLoop(
  messages: Message[],
  signal?: AbortSignal
): Promise<Message[]> {
  const updated = [...messages];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Bail early if the user interrupted (Ctrl+C) before the next API call
    if (signal?.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }

    const stream = client.messages.stream(
      {
        model,
        max_tokens: 8192,
        system: systemPrompt,
        tools: toolDefinitions,
        messages: updated,
      },
      { signal }
    );

    stream.on("text", (text) => {
      process.stdout.write(text);
    });

    const response = await stream.finalMessage();

    // Collect content blocks
    const contentBlocks = response.content;

    if (contentBlocks.length === 0) {
      // Empty response — treat as loop completion
      break;
    }

    // Add assistant message to history
    updated.push({ role: "assistant", content: contentBlocks });

    // Find tool_use blocks
    const toolUseBlocks = contentBlocks.filter(
      (block): block is Anthropic.ContentBlockParam & { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
        block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      // Text-only response — loop complete
      process.stdout.write("\n");
      break;
    }

    // Execute each tool and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolBlock of toolUseBlocks) {
      // Check if the user interrupted (Ctrl+C) between tool dispatches
      if (signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        throw err;
      }

      console.log(`\n[Tool: ${toolBlock.name}]`, JSON.stringify(toolBlock.input));

      let result;
      try {
        result = dispatch(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>
        );
      } catch (dispatchErr: unknown) {
        result = {
          content: `Internal error executing tool '${toolBlock.name}': ${String(dispatchErr)}`,
          isError: true,
        };
      }

      console.log(`[Result]`, result.content.length > 500 ? result.content.slice(0, 500) + "..." : result.content);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result.content,
        ...(result.isError ? { is_error: true } : {}),
      });
    }

    // Send tool results back
    updated.push({ role: "user", content: toolResults });
  }

  return updated;
}
