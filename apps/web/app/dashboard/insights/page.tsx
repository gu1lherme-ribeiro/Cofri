import { currentMonthLabel, formatAmount } from "@/lib/format";
import { categoryBreakdown, dailySeries } from "@/lib/insights";
import { requireSessionUserId } from "@/lib/session";
import { CategoryDonut } from "./category-donut";
import { DailyBars } from "./daily-bars";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const userId = await requireSessionUserId();
  const [byCategory, daily] = await Promise.all([
    categoryBreakdown(userId),
    dailySeries(userId, 30),
  ]);

  const monthExpenseTotal = byCategory.reduce((a, b) => a + b.total, 0);
  const last30Expense = daily.reduce((a, d) => a + d.expense, 0);

  return (
    <>
      <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Gastos por categoria · {currentMonthLabel()}
            </h2>
            <p className="font-mono text-xs text-ink-faint tabular-nums">
              Total {formatAmount(monthExpenseTotal)}
            </p>
          </div>
          <CategoryDonut data={byCategory} />
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Gastos diários · últimos 30 dias
            </h2>
            <p className="font-mono text-xs text-ink-faint tabular-nums">
              Total {formatAmount(last30Expense)}
            </p>
          </div>
        <DailyBars data={daily} />
      </section>
    </>
  );
}
