import { Prisma, prisma } from "@cofri/db";

export type BudgetCrossing = {
  category: string;
  threshold: 80 | 100;
  spent: number;
  budget: number;
};

const THRESHOLDS = [100, 80] as const;

function periodOf(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthRangeOf(d: Date): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
    to: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * Após persistir um gasto, verifica se o usuário acabou de cruzar 80% ou
 * 100% do orçamento dessa categoria neste mês. Retorna o maior limiar
 * cruzado **nesta** transação (dedup via BudgetAlert).
 *
 * Idempotente: chamar 2x pra mesma transação não envia alerta duplicado.
 * Pulando 80% direto pra 100% num só lançamento envia só o 100%.
 */
export async function checkBudgetCrossing(
  userId: string,
  category: string,
  occurredAt: Date,
): Promise<BudgetCrossing | undefined> {
  const budget = await prisma.budget.findUnique({
    where: { userId_category: { userId, category } },
  });
  if (!budget) return undefined;
  const budgetAmount = budget.monthlyAmount.toNumber();
  if (budgetAmount <= 0) return undefined;

  const period = periodOf(occurredAt);
  const { from, to } = monthRangeOf(occurredAt);

  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      kind: "expense",
      category,
      occurredAt: { gte: from, lt: to },
    },
    _sum: { amount: true },
  });
  const spent = agg._sum.amount?.toNumber() ?? 0;
  const pct = (spent / budgetAmount) * 100;

  // Tenta gravar o alerta de cada threshold que o consumo cruzou (>=).
  // O `@@unique` evita re-enviar o mesmo aviso no mesmo período.
  for (const threshold of THRESHOLDS) {
    if (pct < threshold) continue;
    try {
      await prisma.budgetAlert.create({
        data: { userId, category, period, threshold },
      });
      return { category, threshold, spent, budget: budgetAmount };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Já foi alertado neste período pra esse threshold — segue tentando
      // limiares menores caso ainda não estejam registrados.
    }
  }

  return undefined;
}
