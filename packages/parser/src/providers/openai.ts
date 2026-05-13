import OpenAI from "openai";
import type {
  CompleteOptions,
  CompleteResult,
  LLMProvider,
} from "../provider.js";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  readonly model: string;
  private readonly client: OpenAI;

  constructor(opts: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: opts.apiKey });
    this.model = opts.model ?? DEFAULT_MODEL;
  }

  async complete(opts: CompleteOptions): Promise<CompleteResult> {
    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        max_tokens: opts.maxTokens,
        // Forçamos JSON; o system prompt já está instruindo o formato exato.
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userMessage },
        ],
      },
      { signal: opts.signal },
    );

    const text = response.choices[0]?.message.content?.trim() ?? "";
    const usage = response.usage;
    // A OpenAI usa cache automático em prefixos >=1024 tokens; o cached_tokens
    // aparece em prompt_tokens_details quando ele acontece.
    const cachedTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;
    const promptTokens = usage?.prompt_tokens ?? 0;

    return {
      text,
      usage: {
        inputTokens: Math.max(0, promptTokens - cachedTokens),
        outputTokens: usage?.completion_tokens ?? 0,
        // A OpenAI não distingue "criação" de cache na API — quando há miss,
        // o cache é populado server-side sem custo extra. Reportamos como 0
        // pra paridade conceitual e contabilizamos só os reads.
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: cachedTokens,
      },
    };
  }
}
