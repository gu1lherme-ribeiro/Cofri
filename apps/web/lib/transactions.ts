import { prisma } from "@cofri/db";
import { z } from "zod";

/**
 * Categorias default sempre disponíveis. O usuário pode estender essa lista
 * criando orçamentos custom na página de Orçamento — a categoria custom passa
 * a valer pra transações também (ver `lib/categories.ts`).
 */
export const CATEGORIES = [
  "alimentação",
  "transporte",
  "lazer",
  "mercado",
  "saúde",
  "casa",
  "assinatura",
  "trabalho",
  "outros",
] as const;

// Aceita qualquer nome de categoria — validação fina (chars permitidos,
// tamanho) vive em `normalizeCategoryName`. Aqui só garantimos string não
// vazia e curta o suficiente pra caber na coluna do banco.
const categoryString = z.string().trim().min(1).max(30).toLowerCase();

export const transactionFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: categoryString.optional(),
  kind: z.enum(["expense", "income"]).optional(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const transactionUpdateSchema = z
  .object({
    description: z.string().trim().min(1).max(500).optional(),
    category: categoryString.optional(),
    amount: z.number().positive().max(99_999_999.99).optional(),
    occurredAt: z.string().datetime().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "no fields to update",
  });

export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;

export type SerializedTransaction = {
  id: string;
  amount: number;
  kind: "expense" | "income";
  category: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  rawMessage: string;
};

const DEFAULT_LIMIT = 200;

function defaultMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { from, to };
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters,
): Promise<SerializedTransaction[]> {
  const range =
    !filters.from && !filters.to ? defaultMonthRange() : undefined;

  const where = {
    userId,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    occurredAt: {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lt: new Date(filters.to) } : {}),
      ...(range && !filters.from ? { gte: range.from } : {}),
      ...(range && !filters.to ? { lt: range.to } : {}),
    },
  };

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: DEFAULT_LIMIT,
  });

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount.toNumber(),
    kind: r.kind as "expense" | "income",
    category: r.category,
    description: r.description,
    occurredAt: r.occurredAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    rawMessage: r.rawMessage,
  }));
}

export type Totals = {
  expense: number;
  income: number;
  net: number;
  count: number;
};

export function computeTotals(items: SerializedTransaction[]): Totals {
  let expense = 0;
  let income = 0;
  for (const t of items) {
    if (t.kind === "expense") expense += t.amount;
    else income += t.amount;
  }
  return { expense, income, net: income - expense, count: items.length };
}
