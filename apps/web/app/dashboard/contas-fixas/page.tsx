import { requireSessionUserId } from "@/lib/session";
import { listFixedExpenses } from "@/lib/fixed-expenses";
import { loadUserCategories } from "@/lib/categories";
import { formatAmount } from "@/lib/format";
import { FixedExpensesList } from "./fixed-expenses-list";

export const dynamic = "force-dynamic";

export default async function ContasFixasPage() {
  const userId = await requireSessionUserId();
  const [items, categories] = await Promise.all([
    listFixedExpenses(userId),
    loadUserCategories(userId),
  ]);

  const activeItems = items.filter((i) => i.active);
  const totalMonthly = activeItems.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <section className="mb-12 sm:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
          Compromisso mensal
        </p>
        <p className="font-mono text-[2rem] sm:text-[3.25rem] leading-tight sm:leading-none tabular-nums text-ink break-words">
          {activeItems.length > 0 ? (
            <>
              <span className="text-ink">R$ {formatAmount(totalMonthly)}</span>
            </>
          ) : (
            <span className="text-ink-faint">—</span>
          )}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:gap-x-8 mt-4 font-mono text-sm tabular-nums">
          <span className="text-ink-muted">
            <span className="text-ink">{activeItems.length}</span>
            <span className="ml-1.5 text-ink-faint">
              {activeItems.length === 1 ? "ativa" : "ativas"}
            </span>
          </span>
          {items.length - activeItems.length > 0 && (
            <span className="text-ink-muted">
              <span className="text-ink-faint">
                {items.length - activeItems.length}
              </span>
              <span className="ml-1.5 text-ink-faint">pausadas</span>
            </span>
          )}
        </div>
      </section>

      <FixedExpensesList initialItems={items} categories={categories} />
    </>
  );
}
