"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/lib/format";

export type BudgetRowData = {
  category: string;
  monthlyAmount: number;
  spent: number;
};

type Props = {
  initial: BudgetRowData;
};

function parseInput(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const cleaned = t.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n === 0) return null;
  return Math.round(n * 100) / 100;
}

export function BudgetRow({ initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savingLocal, setSavingLocal] = useState(false);
  const [error, setError] = useState(false);

  const hasBudget = data.monthlyAmount > 0;
  const rawPct = hasBudget ? (data.spent / data.monthlyAmount) * 100 : 0;
  const barPct = Math.min(100, rawPct);
  const barColor =
    rawPct >= 100
      ? "var(--color-negative)"
      : rawPct >= 70
        ? "var(--color-accent)"
        : "var(--color-positive)";

  async function commit(raw: string) {
    setEditing(false);
    const parsed = parseInput(raw);

    if (parsed === null) {
      if (data.monthlyAmount === 0) return;
      const prev = data;
      setData({ ...data, monthlyAmount: 0 });
      setError(false);
      setSavingLocal(true);
      try {
        const res = await fetch(
          `/api/budgets/${encodeURIComponent(data.category)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error();
        startTransition(() => router.refresh());
      } catch {
        setData(prev);
        setError(true);
      } finally {
        setSavingLocal(false);
      }
      return;
    }

    if (parsed === data.monthlyAmount) return;

    const prev = data;
    setData({ ...data, monthlyAmount: parsed });
    setError(false);
    setSavingLocal(true);
    try {
      const res = await fetch(
        `/api/budgets/${encodeURIComponent(data.category)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ monthlyAmount: parsed }),
        },
      );
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setData(prev);
      setError(true);
    } finally {
      setSavingLocal(false);
    }
  }

  const busy = pending || savingLocal;

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-display capitalize text-ink">
          {data.category}
        </span>

        <div className="flex items-baseline gap-3 font-mono tabular-nums text-sm min-w-0">
          {hasBudget && (
            <span className="text-ink-muted">{formatAmount(data.spent)}</span>
          )}
          {hasBudget && <span className="text-ink-faint">/</span>}
          {editing ? (
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              defaultValue={
                hasBudget
                  ? data.monthlyAmount.toString().replace(".", ",")
                  : ""
              }
              placeholder="0,00"
              disabled={busy}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => void commit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-28 bg-transparent text-right outline-none border-b border-accent pb-px -mb-px text-ink"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              disabled={busy}
              className={`text-right hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
                hasBudget ? "text-ink" : "text-ink-faint"
              } ${error ? "ring-1 ring-negative" : ""} ${
                busy ? "opacity-60" : ""
              }`}
              title={
                hasBudget ? "Clicar para editar orçamento" : "Definir orçamento"
              }
            >
              {hasBudget ? formatAmount(data.monthlyAmount) : "definir"}
            </button>
          )}
        </div>
      </div>

      {hasBudget && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1 bg-rule rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${barPct}%`,
                background: barColor,
                transition: `width var(--duration-slow) var(--ease-out-quint), background var(--duration-base) var(--ease-out-quint)`,
              }}
            />
          </div>
          <span className="font-mono tabular-nums text-[11px] text-ink-faint w-12 text-right">
            {Math.round(rawPct)}%
          </span>
        </div>
      )}
    </div>
  );
}
