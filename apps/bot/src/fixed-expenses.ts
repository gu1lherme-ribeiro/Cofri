import { Prisma, prisma } from "@cofri/db";
import type { ParsedMessage } from "@cofri/parser";
import { broadcast } from "./realtime.js";
import {
  dayInTZ,
  monthKey,
  nextDueDate,
} from "./fixed-expense-time.js";

export type FixedExpensePersisted = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  leadDays: number[];
  installmentsTotal: number | null;
  installmentsStartMonth: string | null;
};

// Default usado quando a conta fixa é criada via bot — o usuário pode ajustar
// depois pela página web. Bate com a expectativa do enunciado ("dia 8 e 9
// pro vencimento dia 10").
export const DEFAULT_LEAD_DAYS = [1, 2] as const;

/**
 * Mês ("YYYY-MM") do próximo vencimento >= hoje, em SP. Usado como mês da 1ª
 * parcela ao cadastrar contas com prazo via bot.
 */
function nextDueMonth(dueDay: number): string {
  const today = dayInTZ(new Date());
  const next = nextDueDate(today, dueDay);
  return monthKey(next.year, next.month);
}

export async function persistFixedExpense(
  userId: string,
  parsed: ParsedMessage,
): Promise<FixedExpensePersisted> {
  if (parsed.intent !== "fixed_expense") {
    throw new Error(`persistFixedExpense: invalid intent ${parsed.intent}`);
  }
  if (parsed.amount == null) {
    throw new Error("persistFixedExpense: amount is required");
  }
  if (parsed.fixedDay == null) {
    throw new Error("persistFixedExpense: fixedDay is required");
  }

  const name = parsed.description.trim();
  const category = parsed.category ?? "outros";

  // Parcelamento: se o parser detectou total, a 1ª parcela é o próximo
  // vencimento >= hoje. Sem total, conta é recorrente sem fim.
  const installmentsTotal = parsed.installmentsTotal ?? null;
  const installmentsStartMonth = installmentsTotal
    ? nextDueMonth(parsed.fixedDay)
    : null;

  const row = await prisma.fixedExpense.create({
    data: {
      userId,
      name,
      amount: new Prisma.Decimal(parsed.amount),
      dueDay: parsed.fixedDay,
      category,
      leadDays: [...DEFAULT_LEAD_DAYS],
      installmentsTotal,
      installmentsStartMonth,
    },
  });

  broadcast(userId, {
    type: "fixed_expense.created",
    payload: {
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
    },
  });

  return {
    id: row.id,
    name: row.name,
    amount: row.amount.toNumber(),
    dueDay: row.dueDay,
    category: row.category,
    leadDays: row.leadDays,
    installmentsTotal: row.installmentsTotal,
    installmentsStartMonth: row.installmentsStartMonth,
  };
}
