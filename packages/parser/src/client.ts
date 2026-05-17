import { ParsedMessageSchema, type ParsedMessage } from "./schema.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt.js";
import {
  detectProvider,
  type LLMProvider,
  type LLMUsage,
  type ProviderName,
} from "./provider.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenAIProvider } from "./providers/openai.js";

export type ParseOptions = {
  apiKey: string;
  text: string;
  provider?: ProviderName;
  model?: string;
  today?: Date;
  maxTokens?: number;
  signal?: AbortSignal;
  /** Categorias custom específicas do usuário (além das 9 default). Vão pro
   *  user message como `[Categorias adicionais do usuário: ...]` — o system
   *  prompt fica static pra preservar cache hit no Anthropic/OpenAI. */
  extraCategories?: readonly string[];
};

export type ParseResult = {
  parsed: ParsedMessage;
  usage: LLMUsage;
  latencyMs: number;
  provider: ProviderName;
  model: string;
};

const DEFAULT_MAX_TOKENS = 1024;

function nowInSaoPauloISO(now: Date): string {
  // SP é UTC-3 fixo (Brasil aboliu o horário de verão em 2019), então
  // basta deslocar o instante e renderizar como se fosse UTC, plugando
  // o offset literal no fim.
  const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
  const sp = new Date(now.getTime() + SP_OFFSET_MS);
  return `${sp.toISOString().slice(0, 19)}-03:00`;
}

// O modelo deve devolver APENAS JSON, mas se vier embrulhado em ```json ... ```
// (acontece raramente), extraímos o primeiro objeto JSON do texto.
function isolateJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `no JSON object found in model output: ${raw.slice(0, 200)}`,
    );
  }
  return raw.slice(start, end + 1);
}

export function createProvider(opts: {
  provider: ProviderName;
  apiKey: string;
  model?: string;
}): LLMProvider {
  switch (opts.provider) {
    case "anthropic":
      return new AnthropicProvider({ apiKey: opts.apiKey, model: opts.model });
    case "openai":
      return new OpenAIProvider({ apiKey: opts.apiKey, model: opts.model });
  }
}

export async function parseMessage(opts: ParseOptions): Promise<ParseResult> {
  if (!opts.apiKey) throw new Error("parseMessage: apiKey is required");
  if (!opts.text || opts.text.trim() === "") {
    throw new Error("parseMessage: text is empty");
  }

  const providerName = opts.provider ?? detectProvider(opts.apiKey);
  const provider = createProvider({
    provider: providerName,
    apiKey: opts.apiKey,
    model: opts.model,
  });

  const nowISO = nowInSaoPauloISO(opts.today ?? new Date());
  const userMessage = buildUserMessage(
    opts.text,
    nowISO,
    opts.extraCategories ?? [],
  );

  const startedAt = Date.now();
  const { text, usage } = await provider.complete({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    signal: opts.signal,
  });
  const latencyMs = Date.now() - startedAt;

  if (text === "") {
    throw new Error(`parseMessage: ${providerName} returned empty text`);
  }

  const jsonText = isolateJson(text);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      `parseMessage: ${providerName} output is not valid JSON: ${jsonText.slice(0, 200)}`,
      { cause: err },
    );
  }

  const parsed = ParsedMessageSchema.parse(parsedJson);

  return {
    parsed,
    usage,
    latencyMs,
    provider: providerName,
    model: provider.model,
  };
}
