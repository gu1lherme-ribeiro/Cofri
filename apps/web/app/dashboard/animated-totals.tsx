"use client";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { formatAmount } from "@/lib/format";

type Props = {
  income: number;
  expense: number;
  count: number;
};

export function AnimatedTotals({ income, expense, count }: Props) {
  const animIncome = useCountUp(income);
  const animExpense = useCountUp(expense);
  const animNet = useCountUp(income - expense);

  const netSign = animNet < 0 ? "−" : "+";
  const netClass = animNet < 0 ? "text-negative" : "text-positive";

  return (
    <section className="mb-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
        Balanço do mês
      </p>
      <p
        className={`font-mono text-[3.25rem] leading-none tabular-nums ${netClass}`}
      >
        {netSign}
        {formatAmount(Math.abs(animNet))}
      </p>

      <div className="flex items-baseline gap-8 mt-4 font-mono text-sm tabular-nums">
        <span className="text-ink-muted">
          <span className="text-positive">+</span> {formatAmount(animIncome)}
          <span className="ml-1.5 text-ink-faint">entrou</span>
        </span>
        <span className="text-ink-muted">
          <span className="text-negative">−</span> {formatAmount(animExpense)}
          <span className="ml-1.5 text-ink-faint">saiu</span>
        </span>
        <span className="ml-auto text-ink-faint text-xs uppercase tracking-[0.15em]">
          {count} {count === 1 ? "registro" : "registros"}
        </span>
      </div>
    </section>
  );
}
