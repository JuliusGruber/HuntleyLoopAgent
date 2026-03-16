import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === "") {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is not set or is empty.\n" +
        "Please set it before running the agent:\n" +
        "  export ANTHROPIC_API_KEY=your-api-key-here"
    );
    process.exit(1);
  }
  return key.trim();
}

export const apiKey = getApiKey();
export const model =
  process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
export const client = new Anthropic({ apiKey });

export async function validateAuth(): Promise<void> {
  try {
    await client.messages.create({
      model,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
  } catch (err: unknown) {
    if (err instanceof Anthropic.APIError) {
      console.error(`Authentication failed: ${err.message}`);
    } else {
      console.error(`Authentication failed: ${String(err)}`);
    }
    process.exit(1);
  }
}
