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
  /** Quando true, o nome da categoria pode ser editado e a linha pode ser
   *  excluída totalmente. Usado pelas categorias custom criadas pelo usuário. */
  custom?: boolean;
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

export function BudgetRow({ initial, custom = false }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savingLocal, setSavingLocal] = useState(false);
  const [error, setError] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const hasBudget = data.monthlyAmount > 0;
  const rawPct = hasBudget ? (data.spent / data.monthlyAmount) * 100 : 0;
  const barPct = Math.min(100, rawPct);
  const barColor =
    rawPct >= 100
      ? "var(--color-negative)"
      : rawPct >= 70
        ? "var(--color-accent)"
        : "var(--color-positive)";

  async function commitAmount(raw: string) {
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

  async function commitRename(raw: string) {
    setRenaming(false);
    const next = raw.trim().toLowerCase();
    if (next === "" || next === data.category) {
      setRenameError(null);
      return;
    }
    setRenameError(null);
    setSavingLocal(true);
    try {
      const res = await fetch(
        `/api/budgets/${encodeURIComponent(data.category)}/rename`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ to: next }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        const msg =
          j.error === "conflict" || j.error === "conflict_with_default"
            ? "Já existe um orçamento com esse nome."
            : j.error === "invalid_category"
              ? "Nome inválido."
              : "Não consegui renomear.";
        setRenameError(msg);
        return;
      }
      setData({ ...data, category: next });
      startTransition(() => router.refresh());
    } catch {
      setRenameError("Não consegui renomear.");
    } finally {
      setSavingLocal(false);
    }
  }

  async function commitDelete() {
    setCollapsing(true);
    try {
      const res = await fetch(
        `/api/budgets/${encodeURIComponent(data.category)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setCollapsing(false);
      setConfirmingDelete(false);
    }
  }

  const busy = pending || savingLocal;

  return (
    <div
      className="collapsible"
      data-collapsed={collapsing || undefined}
      aria-hidden={collapsing || undefined}
    >
      <div className="py-4">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <span className="font-mono text-xs tracking-wider text-negative uppercase">
              excluir orçamento &ldquo;{data.category}&rdquo;?
            </span>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em] py-1">
              <button
                onClick={() => void commitDelete()}
                disabled={busy}
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              {custom && renaming ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={data.category}
                  disabled={busy}
                  maxLength={30}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => void commitRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setRenaming(false);
                  }}
                  className="font-display bg-transparent outline-none border-b border-accent pb-px -mb-px text-ink w-44"
                />
              ) : custom ? (
                <button
                  onClick={() => setRenaming(true)}
                  disabled={busy}
                  className="font-display capitalize text-ink hover:underline decoration-dotted decoration-ink-faint underline-offset-4 text-left"
                  title="Clicar para renomear"
                >
                  {data.category}
                </button>
              ) : (
                <span className="font-display capitalize text-ink">
                  {data.category}
                </span>
              )}

              <div className="flex items-baseline gap-3 font-mono tabular-nums text-sm min-w-0">
                {hasBudget && (
                  <span className="text-ink-muted">
                    {formatAmount(data.spent)}
                  </span>
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
                    onBlur={(e) => void commitAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
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
                      hasBudget
                        ? "Clicar para editar orçamento"
                        : "Definir orçamento"
                    }
                  >
                    {hasBudget ? formatAmount(data.monthlyAmount) : "definir"}
                  </button>
                )}
                {custom && (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    disabled={busy}
                    aria-label="Excluir orçamento"
                    className="text-ink-faint hover:text-negative md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none ml-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {renameError && (
              <p className="mt-1 font-mono text-[11px] text-negative">
                {renameError}
              </p>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
