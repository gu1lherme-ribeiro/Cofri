"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { CHART_INK_FAINT, CHART_NEGATIVE } from "@/lib/chart-colors";
import { formatAmount } from "@/lib/format";
import type { DailyPoint } from "@/lib/insights";

type Props = {
  data: DailyPoint[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const label = new Date(p.date + "T12:00:00-03:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "short" },
  );
  return (
    <div className="bg-surface border border-rule rounded-[var(--radius-card)] px-3 py-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
        {label}
      </p>
      <p className="font-mono text-sm tabular-nums text-negative mt-1">
        − {formatAmount(p.expense)}
      </p>
    </div>
  );
}

function tickFmt(value: string): string {
  // value = "YYYY-MM-DD"
  const day = value.slice(8, 10);
  // mostrar só dia 1, 5, 10, 15, 20, 25
  if (!["01", "05", "10", "15", "20", "25"].includes(day)) return "";
  return day;
}

export function DailyBars({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.expense, 0);
  const max = data.reduce((acc, d) => Math.max(acc, d.expense), 0);

  if (total === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-muted">Nenhum gasto nos últimos 30 dias.</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={2}
        >
          <XAxis
            dataKey="date"
            tickFormatter={tickFmt}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: CHART_INK_FAINT,
              fontFamily: "var(--font-mono)",
            }}
            interval={0}
            padding={{ left: 4, right: 4 }}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="expense"
            isAnimationActive
            animationDuration={350}
            animationEasing="ease-out"
            radius={[1, 1, 0, 0]}
          >
            {data.map((d) => (
              <Cell
                key={d.date}
                fill={d.expense === max && max > 0 ? CHART_NEGATIVE : CHART_INK_FAINT}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
