"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS } from "@/lib/chart-colors";
import { formatAmount } from "@/lib/format";
import { useCountUp } from "@/lib/hooks/use-count-up";
import type { CategorySlice } from "@/lib/insights";

type Props = {
  data: CategorySlice[];
};

export function CategoryDonut({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.total, 0);
  const animTotal = useCountUp(total);

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-muted">Nenhum gasto neste mês ainda.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col items-center gap-8 sm:grid sm:grid-cols-[220px_1fr] sm:gap-10 sm:items-center lg:grid-cols-[260px_1fr] lg:gap-12">
      <div className="relative w-[clamp(180px,55vw,260px)] aspect-square sm:w-[220px] sm:h-[220px] lg:w-[260px] lg:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="98%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              isAnimationActive
              animationDuration={350}
              animationEasing="ease-out"
            >
              {sorted.map((slice) => (
                <Cell
                  key={slice.category}
                  fill={CATEGORY_COLORS[slice.category] ?? CATEGORY_COLORS.outros}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Total
          </p>
          <p className="font-mono text-lg tabular-nums text-ink mt-1">
            {formatAmount(animTotal)}
          </p>
        </div>
      </div>

      <ul className="w-full space-y-2 font-mono text-sm tabular-nums">
        {sorted.map((slice) => {
          const pct = total > 0 ? (slice.total / total) * 100 : 0;
          const color =
            CATEGORY_COLORS[slice.category] ?? CATEGORY_COLORS.outros;
          return (
            <li
              key={slice.category}
              className="grid grid-cols-[12px_1fr_auto_3rem] items-baseline gap-3 sm:grid-cols-[12px_1fr_auto_3.5rem]"
            >
              <span
                className="block w-2 h-2 rounded-full self-center"
                style={{ background: color }}
              />
              <span className="text-ink-muted lowercase truncate">
                {slice.category}
              </span>
              <span className="text-ink">{formatAmount(slice.total)}</span>
              <span className="text-ink-faint text-right text-xs">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
