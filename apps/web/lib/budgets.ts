import { prisma } from "@cofri/db";
import { z } from "zod";
import { CATEGORIES } from "./transactions";

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

export function isValidCategory(c: string): c is (typeof CATEGORIES)[number] {
  return (CATEGORIES as readonly string[]).includes(c);
}

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

export async function upsertBudget(
  userId: string,
  category: string,
  monthlyAmount: number,
): Promise<SerializedBudget> {
  if (!isValidCategory(category)) {
    throw new Error(`invalid category: ${category}`);
  }
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
  category: string,
): Promise<void> {
  await prisma.budget.deleteMany({ where: { userId, category } });
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
