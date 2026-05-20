import { prisma, Prisma } from "@cofri/db";
import { z } from "zod";
import { normalizeCategoryName } from "./categories";

const MAX_LEAD_DAY = 7;
const MIN_LEAD_DAY = 0;
const NAME_RE = /^[\p{L}\d](?:[\p{L}\d \-_./&]*[\p{L}\d.])?$/u;
const MAX_NAME_LEN = 40;

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

export const fixedExpenseCreateSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LEN),
  amount: z.number().positive().max(99_999_999.99),
  dueDay: z.number().int().min(1).max(31),
  category: z.string().trim().min(1).max(30),
  leadDays: leadDaysSchema.optional(),
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFixedExpenses(
  userId: string,
): Promise<SerializedFixedExpense[]> {
  const rows = await prisma.fixedExpense.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { dueDay: "asc" }, { createdAt: "asc" }],
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

  const row = await prisma.fixedExpense.create({
    data: {
      userId,
      name,
      amount: new Prisma.Decimal(input.amount),
      dueDay: input.dueDay,
      category,
      leadDays: input.leadDays ?? [1, 2],
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
