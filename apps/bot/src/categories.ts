import { prisma } from "@cofri/db";
import { CATEGORIES } from "@cofri/parser";

const DEFAULT_SET = new Set<string>(CATEGORIES);

/**
 * Categorias custom do usuário — aquelas que ele criou na página de Orçamento
 * e que NÃO estão na lista default do parser. Passamos isso pro LLM no user
 * message pra que ele saiba categorizar "ração 50" como "pet" se o usuário
 * tem um orçamento "pet" cadastrado.
 */
export async function loadUserCustomCategories(
  userId: string,
): Promise<string[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    select: { category: true },
  });
  const customs = budgets
    .map((b: { category: string }) => b.category)
    .filter((c: string) => !DEFAULT_SET.has(c));
  // dedup defensivo (a unique constraint já garante, mas barato)
  return [...new Set<string>(customs)];
}
