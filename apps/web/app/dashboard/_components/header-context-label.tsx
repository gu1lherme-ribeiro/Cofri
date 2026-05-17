"use client";

import { usePathname } from "next/navigation";
import { currentMonthLabel } from "@/lib/format";

const LABELS: Record<string, string> = {
  "/dashboard/agenda": "Agenda",
  "/dashboard/insights": "Insights",
  "/dashboard/orcamento": "Orçamento",
};

export function HeaderContextLabel() {
  const pathname = usePathname();
  const label = LABELS[pathname] ?? currentMonthLabel();
  return (
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
      {label}
    </p>
  );
}
