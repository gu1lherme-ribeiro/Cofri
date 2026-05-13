export type LLMUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};

export type CompleteOptions = {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  signal?: AbortSignal;
};

export type CompleteResult = {
  text: string;
  usage: LLMUsage;
};

export interface LLMProvider {
  readonly name: "anthropic" | "openai";
  readonly model: string;
  complete(opts: CompleteOptions): Promise<CompleteResult>;
}

export type ProviderName = "anthropic" | "openai";

export function detectProvider(apiKey: string): ProviderName {
  const k = apiKey.trim();
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("sk-") || k.startsWith("org-")) return "openai";
  throw new Error(
    "could not detect provider from apiKey shape; pass `provider` explicitly",
  );
}
