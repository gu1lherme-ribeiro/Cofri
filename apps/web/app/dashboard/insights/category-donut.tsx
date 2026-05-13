"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS } from "@/lib/chart-colors";
import { formatAmount } from "@/lib/format";
import type { CategorySlice } from "@/lib/insights";

type Props = {
  data: CategorySlice[];
};

export function CategoryDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-muted">Nenhum gasto neste mês ainda.</p>
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.total, 0);
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-[220px_1fr] gap-10 items-center">
      <div className="relative">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={sorted}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={108}
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
            {formatAmount(total)}
          </p>
        </div>
      </div>

      <ul className="space-y-2 font-mono text-sm tabular-nums">
        {sorted.map((slice) => {
          const pct = total > 0 ? (slice.total / total) * 100 : 0;
          const color =
            CATEGORY_COLORS[slice.category] ?? CATEGORY_COLORS.outros;
          return (
            <li
              key={slice.category}
              className="grid grid-cols-[12px_1fr_auto_3.5rem] items-baseline gap-3"
            >
              <span
                className="block w-2 h-2 rounded-full self-center"
                style={{ background: color }}
              />
              <span className="text-ink-muted lowercase">
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
