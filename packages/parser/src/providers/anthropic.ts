import Anthropic from "@anthropic-ai/sdk";
import type {
  CompleteOptions,
  CompleteResult,
  LLMProvider,
} from "../provider.js";

const DEFAULT_MODEL = "claude-haiku-4-5";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  readonly model: string;
  private readonly client: Anthropic;

  constructor(opts: { apiKey: string; model?: string }) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model ?? DEFAULT_MODEL;
  }

  async complete(opts: CompleteOptions): Promise<CompleteResult> {
    const response = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: opts.maxTokens,
        system: [
          {
            type: "text",
            text: opts.systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: opts.userMessage }],
      },
      { signal: opts.signal },
    );

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  }
}
