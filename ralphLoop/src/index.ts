import * as readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";
import { validateAuth } from "./config.js";
import { runAgentLoop } from "./agentLoop.js";

type Message = Anthropic.MessageParam;

async function main(): Promise<void> {
  // Validate API key before showing prompt
  await validateAuth();

  const messages: Message[] = [];
  let abortController: AbortController | null = null;
  let isRunning = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt(): void {
    rl.question("\n> ", async (input) => {
      const trimmed = input.trim();

      if (trimmed === "") {
        prompt();
        return;
      }

      if (trimmed === "exit" || trimmed === "quit") {
        rl.close();
        process.exit(0);
      }

      messages.push({ role: "user", content: trimmed });

      isRunning = true;
      abortController = new AbortController();

      try {
        const updated = await runAgentLoop(messages, abortController.signal);
        // Sync history with what the loop produced
        messages.length = 0;
        messages.push(...updated);
      } catch (err: unknown) {
        // Remove the orphaned user message so the next turn doesn't
        // produce consecutive user messages (which the API rejects).
        messages.pop();

        if (err instanceof Error && err.name === "AbortError") {
          console.log("\n[Interrupted]");
        } else if (
          err instanceof Anthropic.APIError &&
          err.status === 400 &&
          (err.message.includes("context") ||
            err.message.includes("too long") ||
            err.message.includes("token"))
        ) {
          console.error(
            "\nError: Conversation has exceeded the model's context limit. Please start a new topic."
          );
        } else {
          console.error(`\nError: ${String(err)}`);
        }
      } finally {
        isRunning = false;
        abortController = null;
      }

      prompt();
    });
  }

  // Handle Ctrl+C — double-press at prompt to exit (per spec)
  let lastSigint = 0;
  process.on("SIGINT", () => {
    if (isRunning && abortController) {
      // Mid-response: abort the current request
      abortController.abort();
    } else {
      // At prompt: require two presses within 1.5s to exit
      const now = Date.now();
      if (now - lastSigint < 1500) {
        console.log("\nGoodbye!");
        process.exit(0);
      }
      lastSigint = now;
      console.log("\n(Press Ctrl+C again to exit, or type exit/quit)");
      prompt();
    }
  });

  console.log("Coding Agent ready. Type a message to begin. (exit/quit to leave)");
  prompt();
}

main();
