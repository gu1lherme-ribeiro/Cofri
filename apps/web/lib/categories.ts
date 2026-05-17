import { prisma } from "@cofri/db";
import { CATEGORIES } from "./transactions";

const MAX_LEN = 30;
// permite letras (com acentos), dígitos, espaço, hífen, sublinhado.
// rejeita pontuação/emoji/símbolos que dariam dor de cabeça em prompt/UI/URL.
const NAME_RE = /^[\p{L}\d](?:[\p{L}\d \-_]*[\p{L}\d])?$/u;

/**
 * Normaliza o nome de uma categoria: trim, lowercase. Devolve `null` se for
 * vazio, longo demais ou tiver caracteres inválidos. Centraliza a regra pra
 * que API, formulário e migração concordem sobre o que é um nome válido.
 */
export function normalizeCategoryName(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_LEN) return null;
  if (!NAME_RE.test(trimmed)) return null;
  return trimmed;
}

export function isDefaultCategory(name: string): boolean {
  return (CATEGORIES as readonly string[]).includes(name);
}

/**
 * Conjunto de categorias disponíveis pro usuário: as 9 default + qualquer
 * categoria custom que ele tenha cadastrado em Budget. Ordenado em pt-BR.
 */
export async function loadUserCategories(userId: string): Promise<string[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    select: { category: true },
  });
  const set = new Set<string>(CATEGORIES);
  for (const b of budgets) set.add(b.category);
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
