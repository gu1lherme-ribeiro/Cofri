import { Prisma, prisma } from "@cofri/db";
import type { ParsedMessage } from "@cofri/parser";

export type FixedExpensePersisted = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  leadDays: number[];
};

// Default usado quando a conta fixa é criada via bot — o usuário pode ajustar
// depois pela página web. Bate com a expectativa do enunciado ("dia 8 e 9
// pro vencimento dia 10").
export const DEFAULT_LEAD_DAYS = [1, 2] as const;

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

  const row = await prisma.fixedExpense.create({
    data: {
      userId,
      name,
      amount: new Prisma.Decimal(parsed.amount),
      dueDay: parsed.fixedDay,
      category,
      leadDays: [...DEFAULT_LEAD_DAYS],
    },
  });

  return {
    id: row.id,
    name: row.name,
    amount: row.amount.toNumber(),
    dueDay: row.dueDay,
    category: row.category,
    leadDays: row.leadDays,
  };
}
