import type { BudgetCrossing } from "./budgets.js";
import type { FixedExpensePersisted } from "./fixed-expenses.js";
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
  const rel = relativeDescriptor(d);
  return rel ? `${rel} (${dateFmt.format(d)})` : dateFmt.format(d);
}

export function formatTransaction(tx: TransactionPersisted): string {
  if (tx.kind === "expense") {
    return (
      `✅ Gasto registrado com sucesso\n\n` +
      `💸 Valor: ${moneyFmt.format(tx.amount)}\n` +
      `🏷️ Categoria: ${tx.category}\n` +
      `📅 Quando: ${dayLabel(tx.occurredAt)}\n` +
      `📝 Descrição: ${tx.description}`
    );
  }
  return (
    `✅ Receita registrada com sucesso\n\n` +
    `💰 Valor: ${moneyFmt.format(tx.amount)}\n` +
    `🏷️ Categoria: ${tx.category}\n` +
    `📅 Quando: ${dayLabel(tx.occurredAt)}\n` +
    `📝 Descrição: ${tx.description}`
  );
}

export function formatReminder(r: ReminderPersisted): string {
  const relative = relativeDescriptor(r.dueAt);
  const when = relative
    ? `${dateTimeFmt.format(r.dueAt)} · ${relative}`
    : dateTimeFmt.format(r.dueAt);
  return (
    `✅ Lembrete criado com sucesso\n\n` +
    `📝 Tarefa: ${r.text}\n` +
    `📅 Quando: ${when}\n\n` +
    `Vou te avisar no horário marcado.`
  );
}

export function formatReminderNotification(r: ReminderPersisted): string {
  return (
    `🔔 Lembrete agora!\n\n` +
    `📝 ${r.text}\n` +
    `📅 ${dateTimeFmt.format(r.dueAt)}`
  );
}

export function formatFixedExpense(fe: FixedExpensePersisted): string {
  const leadList = [...fe.leadDays].sort((a, b) => b - a).join(" e ");
  return (
    `✅ Conta fixa cadastrada com sucesso\n\n` +
    `🏷️ Nome: ${fe.name}\n` +
    `💰 Valor: ${moneyFmt.format(fe.amount)}\n` +
    `📅 Vence: todo dia ${fe.dueDay}\n` +
    `📂 Categoria: ${fe.category}\n` +
    `🔔 Lembretes: ${leadList} dia(s) antes do vencimento\n\n` +
    `Vou te avisar automaticamente nos dias configurados. ` +
    `Pra mudar valor, dia ou lembretes, abre /dashboard → Contas Fixas.`
  );
}

export type FixedExpenseReminderInput = {
  name: string;
  amount: number;
  dueDay: number;
  daysUntil: number;
  category: string;
};

export function formatFixedExpenseReminder(
  input: FixedExpenseReminderInput,
): string {
  const whenLabel =
    input.daysUntil === 0
      ? "vence hoje"
      : input.daysUntil === 1
        ? "vence amanhã"
        : `vence em ${input.daysUntil} dias`;
  return (
    `🔔 Lembrete de conta fixa\n\n` +
    `📝 Lembre-se de pagar ${input.name} dia ${input.dueDay} (${whenLabel}).\n\n` +
    `💰 Valor: ${moneyFmt.format(input.amount)}\n` +
    `📂 Categoria: ${input.category}`
  );
}

export function formatBudgetCrossing(c: BudgetCrossing): string {
  const pct = Math.round((c.spent / c.budget) * 100);
  const spent = moneyFmt.format(c.spent);
  const budget = moneyFmt.format(c.budget);

  if (c.threshold === 100) {
    const over = moneyFmt.format(c.spent - c.budget);
    return (
      `🚨 Atenção: você estourou o orçamento de ${c.category}.\n` +
      `Total gasto: ${spent} de ${budget} previstos · ${over} acima do limite.`
    );
  }
  // 80%
  const remaining = moneyFmt.format(Math.max(0, c.budget - c.spent));
  return (
    `⚠️ Você já consumiu ${pct}% do orçamento de ${c.category}.\n` +
    `Total gasto: ${spent} de ${budget} previstos · restam ${remaining}.`
  );
}

export const REPLIES = {
  lowConfidence:
    "🤔 Não consegui interpretar essa mensagem com segurança.\n\n" +
    "Eu reconheço quatro tipos de mensagem:\n\n" +
    "💸 Gastos — \"gastei 45 no almoço\"\n" +
    "💰 Receitas — \"recebi 2000 de freela ontem\"\n" +
    "⏰ Lembretes — \"lembrar de ligar pro Carlos sexta 14h\"\n" +
    "🔖 Contas fixas — \"faculdade 800 todo dia 10\"\n\n" +
    "Tenta reformular com um desses formatos.",
  missingAmount:
    "💸 Faltou o valor do gasto.\n\n" +
    "Manda algo como \"gastei 45 no almoço\" — preciso de um número em reais pra registrar.",
  missingAmountFixed:
    "💰 Faltou o valor da conta fixa.\n\n" +
    "Manda algo como \"Faculdade 800 todo dia 10\" — o valor é obrigatório pra conta fixa.",
  missingDueAt:
    "⏰ Faltou definir quando o lembrete deve disparar.\n\n" +
    "Inclui uma data/hora: \"sexta 14h\", \"amanhã 10h\", \"dia 20 às 9h\".",
  missingDueDay:
    "📅 Faltou o dia do vencimento.\n\n" +
    "Manda algo como \"Faculdade 800 todo dia 10\" — preciso saber em qual dia do mês a conta vence.",
  queryNotYet:
    "📊 Consultas diretas ainda não chegaram aqui no bot.\n\n" +
    "Enquanto isso, abre o /dashboard pra ver gastos, receitas, lembretes e contas fixas organizados.",
  parserError:
    "😕 Tive um problema técnico ao processar sua mensagem.\n\n" +
    "Tenta de novo daqui a alguns segundos — se persistir, me avisa.",
  unknown:
    "🤷 Não consegui classificar essa mensagem.\n\n" +
    "Precisa ser um gasto, receita, lembrete ou conta fixa. Tenta reformular num desses formatos?",
  noApiKey:
    "🔑 Antes de começar, preciso da sua chave de LLM (BYOK).\n\n" +
    "1. Manda /dashboard\n" +
    "2. Abre a aba \"Conta\"\n" +
    "3. Cola uma chave Anthropic ou OpenAI\n\n" +
    "Você só paga seu próprio uso — eu não armazeno a chave em texto puro.",
} as const;
