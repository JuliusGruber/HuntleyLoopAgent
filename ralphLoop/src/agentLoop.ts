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
      console.log(`\n[Tool: ${toolBlock.name}]`, JSON.stringify(toolBlock.input));

      const result = dispatch(
        toolBlock.name,
        toolBlock.input as Record<string, unknown>
      );

      console.log(`[Result]`, result.length > 500 ? result.slice(0, 500) + "..." : result);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    // Send tool results back
    updated.push({ role: "user", content: toolResults });
  }

  return updated;
}
