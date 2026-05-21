import { prisma, Prisma } from "@cofri/db";
import { z } from "zod";
import { normalizeCategoryName } from "./categories";

const MAX_LEAD_DAY = 7;
const MIN_LEAD_DAY = 0;
const NAME_RE = /^[\p{L}\d](?:[\p{L}\d \-_./&]*[\p{L}\d.])?$/u;
const MAX_NAME_LEN = 40;
const MAX_INSTALLMENTS = 480; // 40 anos — cobre financiamento imobiliário (até 360 meses) com margem
const MONTH_KEY_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function normalizeName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LEN) return null;
  if (!NAME_RE.test(trimmed)) return null;
  // Capitaliza a primeira letra (estilo "Faculdade", "Aluguel") sem alterar
  // o resto, pra preservar capitalizações como "Plano de saúde".
  return trimmed[0]!.toUpperCase() + trimmed.slice(1);
}

const leadDaysSchema = z
  .array(z.number().int().min(MIN_LEAD_DAY).max(MAX_LEAD_DAY))
  .min(1)
  .max(MAX_LEAD_DAY + 1)
  .transform((arr) => Array.from(new Set(arr)).sort((a, b) => a - b));

// Aceita ou "installmentsTotal" (número de parcelas) ou "endMonth"
// ("YYYY-MM" do último vencimento). Os dois reduzem ao mesmo modelo no banco
// (installmentsTotal + installmentsStartMonth), via deriveInstallments abaixo.
const durationSchema = z
  .object({
    kind: z.literal("recurring"),
  })
  .or(
    z.object({
      kind: z.literal("installments"),
      total: z.number().int().min(2).max(MAX_INSTALLMENTS),
    }),
  )
  .or(
    z.object({
      kind: z.literal("endMonth"),
      endMonth: z.string().regex(MONTH_KEY_RE, "invalid_month"),
    }),
  );

export const fixedExpenseCreateSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LEN),
  amount: z.number().positive().max(99_999_999.99),
  dueDay: z.number().int().min(1).max(31),
  category: z.string().trim().min(1).max(30),
  leadDays: leadDaysSchema.optional(),
  duration: durationSchema.optional(),
});

export type FixedExpenseCreateInput = z.infer<typeof fixedExpenseCreateSchema>;

export const fixedExpenseUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LEN).optional(),
    amount: z.number().positive().max(99_999_999.99).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    category: z.string().trim().min(1).max(30).optional(),
    leadDays: leadDaysSchema.optional(),
    active: z.boolean().optional(),
    duration: durationSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "no fields to update",
  });

export type FixedExpenseUpdateInput = z.infer<typeof fixedExpenseUpdateSchema>;

export type SerializedFixedExpense = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  leadDays: number[];
  active: boolean;
  installmentsTotal: number | null;
  installmentsStartMonth: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class FixedExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixedExpenseValidationError";
  }
}

export class FixedExpenseNotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "FixedExpenseNotFoundError";
  }
}

function serialize(row: {
  id: string;
  name: string;
  amount: Prisma.Decimal;
  dueDay: number;
  category: string;
  leadDays: number[];
  active: boolean;
  installmentsTotal: number | null;
  installmentsStartMonth: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializedFixedExpense {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount.toNumber(),
    dueDay: row.dueDay,
    category: row.category,
    leadDays: row.leadDays,
    active: row.active,
    installmentsTotal: row.installmentsTotal,
    installmentsStartMonth: row.installmentsStartMonth,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Calcula o próximo mês de vencimento >= hoje em SP timezone, como "YYYY-MM".
function nextDueMonthSP(dueDay: number): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cap = Math.min(dueDay, daysInMonth);

  // Se o vencimento deste mês ainda não passou, começa este mês.
  if (cap >= day) return `${year}-${String(month).padStart(2, "0")}`;
  // Caso contrário, começa no próximo mês.
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function monthsInclusive(from: string, to: string): number | null {
  const a = MONTH_KEY_RE.exec(from);
  const b = MONTH_KEY_RE.exec(to);
  if (!a || !b) return null;
  const ay = Number(a[1]);
  const am = Number(a[2]);
  const by = Number(b[1]);
  const bm = Number(b[2]);
  return (by - ay) * 12 + (bm - am) + 1;
}

/**
 * Converte o input de duração (recurring / installments / endMonth) nos campos
 * persistidos no banco. `endMonth` é resolvido relativo ao próximo vencimento
 * em SP. Retorna { total: null, start: null } pra recorrente sem fim.
 */
function deriveInstallments(
  dueDay: number,
  duration?: FixedExpenseCreateInput["duration"],
): { total: number | null; start: string | null } {
  if (!duration || duration.kind === "recurring") {
    return { total: null, start: null };
  }
  const start = nextDueMonthSP(dueDay);
  if (duration.kind === "installments") {
    return { total: duration.total, start };
  }
  // endMonth — separa os 3 modos de falha pra UI mostrar mensagem específica.
  // Diferente de "installments" (que exige min 2 — "1 parcela" não é parcelado),
  // aqui aceitamos total = 1: o usuário pode ter uma conta que termina no mês
  // do próximo vencimento (uma única ocorrência futura).
  const total = monthsInclusive(start, duration.endMonth);
  if (total == null) {
    throw new FixedExpenseValidationError("invalid_end_month_format");
  }
  if (total < 1) {
    throw new FixedExpenseValidationError("invalid_end_month_past");
  }
  if (total > MAX_INSTALLMENTS) {
    throw new FixedExpenseValidationError("invalid_end_month_far");
  }
  return { total, start };
}

export async function listFixedExpenses(
  userId: string,
): Promise<SerializedFixedExpense[]> {
  const rows = await prisma.fixedExpense.findMany({
    where: { userId },
    // Ativas primeiro, concluídas (completedAt) por último na lista crua —
    // o cliente reordena/filtra por seção (ativas/pausadas/concluídas).
    orderBy: [
      { completedAt: "asc" },
      { active: "desc" },
      { dueDay: "asc" },
      { createdAt: "asc" },
    ],
  });
  return rows.map(serialize);
}

export async function createFixedExpense(
  userId: string,
  input: FixedExpenseCreateInput,
): Promise<SerializedFixedExpense> {
  const name = normalizeName(input.name);
  if (!name) throw new FixedExpenseValidationError("invalid_name");
  const category = normalizeCategoryName(input.category);
  if (!category) throw new FixedExpenseValidationError("invalid_category");

  const installments = deriveInstallments(input.dueDay, input.duration);

  const row = await prisma.fixedExpense.create({
    data: {
      userId,
      name,
      amount: new Prisma.Decimal(input.amount),
      dueDay: input.dueDay,
      category,
      leadDays: input.leadDays ?? [1, 2],
      installmentsTotal: installments.total,
      installmentsStartMonth: installments.start,
    },
  });
  return serialize(row);
}

export async function updateFixedExpense(
  userId: string,
  id: string,
  input: FixedExpenseUpdateInput,
): Promise<SerializedFixedExpense> {
  const existing = await prisma.fixedExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new FixedExpenseNotFoundError();

  const data: Prisma.FixedExpenseUpdateInput = {};
  if (input.name !== undefined) {
    const name = normalizeName(input.name);
    if (!name) throw new FixedExpenseValidationError("invalid_name");
    data.name = name;
  }
  if (input.amount !== undefined) {
    data.amount = new Prisma.Decimal(input.amount);
  }
  if (input.dueDay !== undefined) data.dueDay = input.dueDay;
  if (input.category !== undefined) {
    const category = normalizeCategoryName(input.category);
    if (!category) throw new FixedExpenseValidationError("invalid_category");
    data.category = category;
  }
  if (input.leadDays !== undefined) data.leadDays = input.leadDays;
  if (input.active !== undefined) data.active = input.active;
  if (input.duration !== undefined) {
    // Trocar duração reinicia o cronômetro: usa o dueDay novo se também
    // veio no payload, senão o vigente.
    const effectiveDueDay = input.dueDay ?? existing.dueDay;
    const installments = deriveInstallments(effectiveDueDay, input.duration);
    data.installmentsTotal = installments.total;
    data.installmentsStartMonth = installments.start;
    // Se o usuário reativou uma duração nova, zera o completedAt pra que o
    // notifier volte a processar.
    if (existing.completedAt) data.completedAt = null;
  }

  const row = await prisma.fixedExpense.update({
    where: { id },
    data,
  });
  return serialize(row);
}

export async function deleteFixedExpense(
  userId: string,
  id: string,
): Promise<void> {
  const res = await prisma.fixedExpense.deleteMany({
    where: { id, userId },
  });
  if (res.count === 0) throw new FixedExpenseNotFoundError();
}
