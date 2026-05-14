import type { BudgetCrossing } from "./budgets.js";
import type { ReminderPersisted, TransactionPersisted } from "./persist.js";

const TZ = "America/Sao_Paulo";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function startOfDayInSP(d: Date): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(y, m - 1, day));
}

// Retorna um descritor relativo ("hoje", "ontem", "em 3 dias") quando faz
// sentido, ou null quando uma data absoluta já é a melhor representação.
function relativeDescriptor(d: Date): string | null {
  const targetDay = startOfDayInSP(d).getTime();
  const today = startOfDayInSP(new Date()).getTime();
  const diff = Math.round((targetDay - today) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === -1) return "ontem";
  if (diff === 1) return "amanhã";
  if (diff < -1 && diff > -7) return `${-diff} dias atrás`;
  if (diff > 1 && diff < 7) return `em ${diff} dias`;
  return null;
}

function dayLabel(d: Date): string {
  return relativeDescriptor(d) ?? dateFmt.format(d);
}

export function formatTransaction(tx: TransactionPersisted): string {
  const verb = tx.kind === "expense" ? "em" : "recebido em";
  const mark = tx.kind === "expense" ? "✓" : "💰";
  return (
    `${mark} ${moneyFmt.format(tx.amount)} ${verb} ${tx.category} · ${dayLabel(tx.occurredAt)}\n` +
    `"${tx.description}"`
  );
}

export function formatReminder(r: ReminderPersisted): string {
  const relative = relativeDescriptor(r.dueAt);
  const dateLine = relative
    ? `${dateTimeFmt.format(r.dueAt)} · ${relative}`
    : dateTimeFmt.format(r.dueAt);
  return `⏰ Lembrete · ${r.text}\n${dateLine}`;
}

export function formatReminderNotification(r: ReminderPersisted): string {
  return `🔔 Lembrete · ${r.text}\n${dateTimeFmt.format(r.dueAt)}`;
}

export function formatBudgetCrossing(c: BudgetCrossing): string {
  const pct = Math.round((c.spent / c.budget) * 100);
  const spent = moneyFmt.format(c.spent);
  const budget = moneyFmt.format(c.budget);

  if (c.threshold === 100) {
    const over = moneyFmt.format(c.spent - c.budget);
    return (
      `🚨 Estourou o orçamento de ${c.category}.\n` +
      `${spent} de ${budget} · ${over} acima`
    );
  }
  // 80%
  const remaining = moneyFmt.format(Math.max(0, c.budget - c.spent));
  return (
    `⚠️ Você já consumiu ${pct}% do orçamento de ${c.category}.\n` +
    `${spent} de ${budget} · faltam ${remaining}`
  );
}

export const REPLIES = {
  lowConfidence:
    "🤔 Não consegui interpretar isso.\n\n" +
    "Eu entendo três tipos de mensagem:\n\n" +
    "💸 Gastos: \"gastei 45 no almoço\"\n" +
    "💰 Receitas: \"recebi 2000 de freela ontem\"\n" +
    "⏰ Lembretes: \"lembrar de pagar luz dia 15\"",
  missingAmount:
    "Faltou o valor 💸\n\n" +
    "Manda algo como \"gastei 45 no almoço\".",
  missingDueAt:
    "Faltou quando ⏰\n\n" +
    "Tenta \"sexta 14h\" ou \"amanhã 10h\".",
  queryNotYet:
    "📊 Consultas diretas chegam em breve.\n\n" +
    "Por enquanto, abre o /dashboard pra ver tudo organizado.",
  parserError:
    "Ops, tive um problema pra processar sua mensagem 😕\n\n" +
    "Tenta de novo daqui a uns segundos.",
  unknown:
    "Não consegui classificar essa mensagem 🤷\n\n" +
    "Precisa ser um gasto, receita ou lembrete. Tenta reformular?",
  noApiKey:
    "Antes de começar, configure sua chave LLM 🔑\n\n" +
    "1. Manda /dashboard\n" +
    "2. Abre a aba \"Conta\"\n" +
    "3. Cola uma chave Anthropic ou OpenAI\n\n" +
    "Você só paga seu próprio uso (BYOK).",
} as const;
