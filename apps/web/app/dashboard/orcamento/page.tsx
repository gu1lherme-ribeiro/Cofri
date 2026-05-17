import { requireSessionUserId } from "@/lib/session";
import { loadBudgetSummary } from "@/lib/budgets";
import { CATEGORIES } from "@/lib/transactions";
import { currentMonthLabel, formatAmount } from "@/lib/format";
import { BudgetList } from "./budget-list";

export const dynamic = "force-dynamic";

export default async function OrcamentoPage() {
  const userId = await requireSessionUserId();
  const summary = await loadBudgetSummary(userId);

  const rows = CATEGORIES.map((c) => ({
    category: c,
    monthlyAmount:
      summary.byCategory.find((b) => b.category === c)?.monthlyAmount ?? 0,
    spent: summary.spendByCategory[c] ?? 0,
  }));

  const totalBudgeted = summary.totalBudgeted;
  const totalSpent = summary.totalSpent;
  const totalPct =
    totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0;

  return (
    <>
      <section className="mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
            Orçamento · {currentMonthLabel()}
          </p>
          <p className="font-mono text-[3.25rem] leading-none tabular-nums text-ink">
            {totalBudgeted > 0 ? (
              <>
                <span className="text-ink">R$ {formatAmount(totalSpent)}</span>
                <span className="text-ink-faint"> / </span>
                <span className="text-ink-muted">
                  R$ {formatAmount(totalBudgeted)}
                </span>
              </>
            ) : (
              <span className="text-ink-faint">—</span>
            )}
          </p>

          {totalBudgeted > 0 && (
            <div className="mt-5">
              <div className="h-1 bg-rule rounded-full overflow-hidden max-w-md">
                <div
                  className="h-full"
                  style={{
                    width: `${totalPct}%`,
                    background:
                      totalPct >= 100
                        ? "var(--color-negative)"
                        : totalPct >= 70
                          ? "var(--color-accent)"
                          : "var(--color-positive)",
                    transition: `width var(--duration-slow) var(--ease-out-quint)`,
                  }}
                />
              </div>
              <p className="font-mono text-xs tabular-nums text-ink-muted mt-2">
                {Math.round(totalPct)}% consumido
              </p>
            </div>
          )}
        </section>

      <BudgetList initial={rows} />
    </>
  );
}
