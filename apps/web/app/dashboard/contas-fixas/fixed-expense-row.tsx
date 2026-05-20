"use client";

import { useState } from "react";
import type { SerializedFixedExpense } from "@/lib/fixed-expenses";
import { formatAmount } from "@/lib/format";
import { LeadDaysPicker } from "./lead-days-picker";

type Props = {
  initial: SerializedFixedExpense;
  categories: string[];
  onUpdated: (item: SerializedFixedExpense) => void;
  onDeleted: (id: string) => void;
};

function parseAmount(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const cleaned = t.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function parseDay(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1 || n > 31) return null;
  return n;
}

function formatLeadDays(days: number[]): string {
  if (days.length === 0) return "—";
  const sorted = [...days].sort((a, b) => b - a);
  return sorted
    .map((d) => (d === 0 ? "no dia" : `${d}d`))
    .join(" · ");
}

export function FixedExpenseRow({
  initial,
  categories,
  onUpdated,
  onDeleted,
}: Props) {
  const [data, setData] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Partial<SerializedFixedExpense>) {
    setError(null);
    setSaving(true);
    const prev = data;
    setData({ ...data, ...payload });
    try {
      const res = await fetch(`/api/fixed-expenses/${data.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const { item } = (await res.json()) as { item: SerializedFixedExpense };
      setData(item);
      onUpdated(item);
    } catch {
      setData(prev);
      setError("Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function commitDelete() {
    setCollapsing(true);
    try {
      const res = await fetch(`/api/fixed-expenses/${data.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      onDeleted(data.id);
    } catch {
      setCollapsing(false);
      setConfirmingDelete(false);
    }
  }

  async function commitAmount(raw: string) {
    setEditingAmount(false);
    const parsed = parseAmount(raw);
    if (parsed === null || parsed === data.amount) return;
    await patch({ amount: parsed });
  }

  async function commitDay(raw: string) {
    setEditingDay(false);
    const parsed = parseDay(raw);
    if (parsed === null || parsed === data.dueDay) return;
    await patch({ dueDay: parsed });
  }

  async function commitName(raw: string) {
    setEditingName(false);
    const next = raw.trim();
    if (!next || next === data.name) return;
    await patch({ name: next });
  }

  function toggleActive() {
    void patch({ active: !data.active });
  }

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
              excluir conta &ldquo;{data.name}&rdquo;?
            </span>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em] py-1">
              <button
                onClick={() => void commitDelete()}
                disabled={saving}
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={saving}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              {editingName ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={data.name}
                  disabled={saving}
                  maxLength={40}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => void commitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="font-display bg-transparent outline-none border-b border-accent pb-px -mb-px text-ink w-48"
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  disabled={saving}
                  className={`font-display text-left hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
                    data.active ? "text-ink" : "text-ink-faint line-through decoration-solid"
                  }`}
                  title="Clicar para renomear"
                >
                  {data.name}
                </button>
              )}

              <div className="flex items-baseline gap-3 font-mono tabular-nums text-sm">
                {editingAmount ? (
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    defaultValue={data.amount.toString().replace(".", ",")}
                    disabled={saving}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => void commitAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingAmount(false);
                    }}
                    className="w-28 bg-transparent text-right outline-none border-b border-accent pb-px -mb-px text-ink"
                  />
                ) : (
                  <button
                    onClick={() => setEditingAmount(true)}
                    disabled={saving}
                    className={`text-right hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
                      data.active ? "text-ink" : "text-ink-faint"
                    }`}
                    title="Clicar para editar valor"
                  >
                    R$ {formatAmount(data.amount)}
                  </button>
                )}

                <button
                  onClick={() => setConfirmingDelete(true)}
                  disabled={saving}
                  aria-label="Excluir conta fixa"
                  className="text-ink-faint hover:text-negative md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint">
              {editingDay ? (
                <span>
                  vence dia{" "}
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    defaultValue={data.dueDay.toString()}
                    disabled={saving}
                    maxLength={2}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => void commitDay(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingDay(false);
                    }}
                    className="w-8 bg-transparent text-right outline-none border-b border-accent pb-px -mb-px text-ink font-mono tabular-nums"
                  />
                </span>
              ) : (
                <button
                  onClick={() => setEditingDay(true)}
                  disabled={saving}
                  className="hover:text-ink hover:underline decoration-dotted decoration-ink-faint underline-offset-4 transition-colors duration-[var(--duration-base)]"
                  title="Clicar para editar dia"
                >
                  vence dia {data.dueDay}
                </button>
              )}
              <span aria-hidden>·</span>
              <span className="capitalize">{data.category}</span>
              <span aria-hidden>·</span>
              <span title="Lembretes antes do vencimento">
                avisos: {formatLeadDays(data.leadDays)}
              </span>
              <span aria-hidden>·</span>
              <button
                onClick={() => setExpanded((e) => !e)}
                disabled={saving}
                className="uppercase tracking-[0.15em] hover:text-ink transition-colors duration-[var(--duration-base)]"
              >
                {expanded ? "fechar" : "mais opções"}
              </button>
            </div>

            {expanded && (
              <div className="mt-4 border-t border-rule pt-4 space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-2">
                    Dias de aviso antes do vencimento
                  </p>
                  <LeadDaysPicker
                    value={data.leadDays}
                    disabled={saving}
                    onChange={(next) => void patch({ leadDays: next })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                    Categoria
                  </p>
                  <select
                    value={data.category}
                    disabled={saving}
                    onChange={(e) => void patch({ category: e.target.value })}
                    className="bg-transparent text-ink border-b border-rule focus:border-accent outline-none py-1 transition-colors duration-[var(--duration-base)] capitalize"
                  >
                    {categories.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className="capitalize bg-surface text-ink"
                      >
                        {c}
                      </option>
                    ))}
                    {!categories.includes(data.category) && (
                      <option
                        value={data.category}
                        className="capitalize bg-surface text-ink"
                      >
                        {data.category}
                      </option>
                    )}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                    Status
                  </p>
                  <button
                    onClick={toggleActive}
                    disabled={saving}
                    className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-accent transition-colors duration-[var(--duration-base)]"
                  >
                    {data.active ? "pausar lembretes" : "reativar lembretes"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-2 font-mono text-[11px] text-negative">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
