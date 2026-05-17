import { prisma } from "@cofri/db";
import { z } from "zod";
import { isDefaultCategory, normalizeCategoryName } from "./categories";

export const budgetUpsertSchema = z.object({
  monthlyAmount: z.number().positive().max(99_999_999.99),
});

export type BudgetUpsert = z.infer<typeof budgetUpsertSchema>;

export type SerializedBudget = {
  category: string;
  monthlyAmount: number;
  spent: number;
  updatedAt: string;
};

function currentMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { from, to };
}

async function spendByCategory(userId: string): Promise<Map<string, number>> {
  const { from, to } = currentMonthRange();
  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      kind: "expense",
      occurredAt: { gte: from, lt: to },
    },
    _sum: { amount: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, r._sum.amount?.toNumber() ?? 0);
  }
  return map;
}

export async function listBudgets(userId: string): Promise<SerializedBudget[]> {
  const [rows, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      orderBy: { category: "asc" },
    }),
    spendByCategory(userId),
  ]);
  return rows.map((b) => ({
    category: b.category,
    monthlyAmount: b.monthlyAmount.toNumber(),
    spent: spent.get(b.category) ?? 0,
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export class BudgetNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetNameError";
  }
}

export class BudgetConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetConflictError";
  }
}

export class BudgetNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetNotFoundError";
  }
}

export async function upsertBudget(
  userId: string,
  rawCategory: string,
  monthlyAmount: number,
): Promise<SerializedBudget> {
  const category = normalizeCategoryName(rawCategory);
  if (!category) throw new BudgetNameError("invalid_category");

  const row = await prisma.budget.upsert({
    where: { userId_category: { userId, category } },
    create: { userId, category, monthlyAmount },
    update: { monthlyAmount },
  });
  const { from, to } = currentMonthRange();
  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      kind: "expense",
      category,
      occurredAt: { gte: from, lt: to },
    },
    _sum: { amount: true },
  });
  return {
    category: row.category,
    monthlyAmount: row.monthlyAmount.toNumber(),
    spent: agg._sum.amount?.toNumber() ?? 0,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteBudget(
  userId: string,
  rawCategory: string,
): Promise<void> {
  const category = normalizeCategoryName(rawCategory);
  if (!category) throw new BudgetNameError("invalid_category");
  // Default categories só perdem o valor; o "nome" continua existindo na lista
  // fixa. Custom desaparece completamente porque o nome só existia em Budget.
  await prisma.budget.deleteMany({ where: { userId, category } });
}

/**
 * Renomeia uma categoria custom. Renomeia também as transações que usam o
 * nome antigo pra manter o "spent" do orçamento coerente. Falha se o destino
 * já existe (não fundimos orçamentos silenciosamente) ou se o nome de origem
 * é uma categoria default (default não pode ser renomeada).
 */
export async function renameBudget(
  userId: string,
  rawFrom: string,
  rawTo: string,
): Promise<SerializedBudget> {
  const from = normalizeCategoryName(rawFrom);
  const to = normalizeCategoryName(rawTo);
  if (!from || !to) throw new BudgetNameError("invalid_category");
  if (from === to) throw new BudgetNameError("same_name");
  if (isDefaultCategory(from)) throw new BudgetNameError("cannot_rename_default");
  if (isDefaultCategory(to)) throw new BudgetConflictError("conflict_with_default");

  const renamed = await prisma.$transaction(async (tx) => {
    const existing = await tx.budget.findUnique({
      where: { userId_category: { userId, category: from } },
    });
    if (!existing) throw new BudgetNotFoundError("not_found");
    const conflict = await tx.budget.findUnique({
      where: { userId_category: { userId, category: to } },
    });
    if (conflict) throw new BudgetConflictError("conflict");

    await tx.budget.delete({
      where: { userId_category: { userId, category: from } },
    });
    const created = await tx.budget.create({
      data: {
        userId,
        category: to,
        monthlyAmount: existing.monthlyAmount,
      },
    });
    await tx.transaction.updateMany({
      where: { userId, category: from },
      data: { category: to },
    });
    return created;
  });

  const range = currentMonthRange();
  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      kind: "expense",
      category: to,
      occurredAt: { gte: range.from, lt: range.to },
    },
    _sum: { amount: true },
  });

  return {
    category: renamed.category,
    monthlyAmount: renamed.monthlyAmount.toNumber(),
    spent: agg._sum.amount?.toNumber() ?? 0,
    updatedAt: renamed.updatedAt.toISOString(),
  };
}

export type BudgetSummary = {
  byCategory: SerializedBudget[];
  spendByCategory: Record<string, number>;
  totalBudgeted: number;
  totalSpent: number;
};

export async function loadBudgetSummary(
  userId: string,
): Promise<BudgetSummary> {
  const [rows, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      orderBy: { category: "asc" },
    }),
    spendByCategory(userId),
  ]);

  const byCategory: SerializedBudget[] = rows.map((b) => ({
    category: b.category,
    monthlyAmount: b.monthlyAmount.toNumber(),
    spent: spent.get(b.category) ?? 0,
    updatedAt: b.updatedAt.toISOString(),
  }));

  const totalBudgeted = byCategory.reduce((s, b) => s + b.monthlyAmount, 0);
  const totalSpent = byCategory.reduce((s, b) => s + b.spent, 0);

  return {
    byCategory,
    spendByCategory: Object.fromEntries(spent),
    totalBudgeted,
    totalSpent,
  };
}
