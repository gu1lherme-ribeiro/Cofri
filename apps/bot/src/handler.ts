import {
  LOW_CONFIDENCE_THRESHOLD,
  parseMessage,
  type ParseResult,
} from "@cofri/parser";
import { upsertUserByTelegramId } from "./users.js";
import { resolveUserApiKey } from "./api-keys.js";
import { loadUserCustomCategories } from "./categories.js";
import { persistReminder, persistTransaction } from "./persist.js";
import { persistFixedExpense } from "./fixed-expenses.js";
import {
  REPLIES,
  formatBudgetCrossing,
  formatFixedExpense,
  formatReminder,
  formatTransaction,
} from "./format.js";

export async function handleTextMessage(
  text: string,
  telegramId: number,
): Promise<string> {
  const user = await upsertUserByTelegramId(telegramId);

  const resolved = await resolveUserApiKey(user.id);
  if (!resolved) return REPLIES.noApiKey;

  // Falha aqui não pode derrubar o parse — sem categorias extras o LLM
  // simplesmente cai na default mais próxima (comportamento antigo).
  const extraCategories = await loadUserCustomCategories(user.id).catch(
    (err) => {
      console.error("[handler] loadUserCustomCategories error:", err);
      return [] as string[];
    },
  );

  let result: ParseResult;
  try {
    result = await parseMessage({
      apiKey: resolved.apiKey,
      provider: resolved.provider,
      text,
      extraCategories,
    });
  } catch (err) {
    console.error("[handler] parser error:", err);
    return REPLIES.parserError;
  }

  const { parsed, latencyMs, usage, provider, model } = result;
  console.log(
    `[parser] ${provider}/${model} ${latencyMs}ms · ` +
      `key=${resolved.source} ` +
      `in=${usage.inputTokens} out=${usage.outputTokens} ` +
      `cache_read=${usage.cacheReadInputTokens} ` +
      `intent=${parsed.intent} confidence=${parsed.confidence}`,
  );

  if (parsed.confidence < LOW_CONFIDENCE_THRESHOLD) {
    return REPLIES.lowConfidence;
  }

  switch (parsed.intent) {
    case "expense":
    case "income": {
      if (parsed.amount == null) return REPLIES.missingAmount;
      const tx = await persistTransaction(user.id, parsed, text);
      const main = formatTransaction(tx);
      if (tx.budgetCrossing) {
        return `${main}\n\n${formatBudgetCrossing(tx.budgetCrossing)}`;
      }
      return main;
    }
    case "reminder": {
      if (!parsed.occurredAt) return REPLIES.missingDueAt;
      const r = await persistReminder(user.id, parsed);
      return formatReminder(r);
    }
    case "fixed_expense": {
      if (parsed.amount == null) return REPLIES.missingAmountFixed;
      if (parsed.fixedDay == null) return REPLIES.missingDueDay;
      const fe = await persistFixedExpense(user.id, parsed);
      return formatFixedExpense(fe);
    }
    case "query":
      return REPLIES.queryNotYet;
    case "unknown":
      return REPLIES.unknown;
  }
}
