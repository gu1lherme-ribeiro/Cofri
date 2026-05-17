"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function parseAmount(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const cleaned = t.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

type Props = {
  /** Categorias que já existem pro usuário (default + custom). Usado pra
   *  bloquear a criação de um nome que já está em uso. */
  existing: string[];
};

export function AddBudgetForm({ existing }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName("");
    setAmount("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim().toLowerCase();
    const parsedAmount = parseAmount(amount);
    if (!trimmedName) {
      setError("Informe o nome.");
      return;
    }
    if (existing.includes(trimmedName)) {
      setError("Já existe um orçamento com esse nome.");
      return;
    }
    if (parsedAmount === null) {
      setError("Informe um valor maior que zero.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/budgets/${encodeURIComponent(trimmedName)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ monthlyAmount: parsedAmount }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "invalid_category"
            ? "Nome inválido. Use letras, números, espaço, hífen ou _."
            : "Não consegui criar.",
        );
        return;
      }
      reset();
      setOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Não consegui criar.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || pending;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-accent transition-colors duration-[var(--duration-base)]"
      >
        + adicionar orçamento
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 border border-rule rounded-[var(--radius-card)] p-4 sm:p-5 space-y-3"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        Novo orçamento
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-4">
        <div className="flex-1 min-w-0">
          <label
            htmlFor="new-budget-name"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Nome
          </label>
          <input
            id="new-budget-name"
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pet, investimento, educação…"
            disabled={busy}
            maxLength={30}
            className="w-full bg-transparent text-ink lowercase border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
          />
        </div>
        <div className="sm:w-40">
          <label
            htmlFor="new-budget-amount"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Valor mensal
          </label>
          <input
            id="new-budget-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            disabled={busy}
            className="w-full bg-transparent text-ink font-mono tabular-nums border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
          />
        </div>
      </div>

      {error && (
        <p className="font-mono text-[11px] text-negative">{error}</p>
      )}

      <div className="flex items-center gap-5 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="font-mono text-xs uppercase tracking-[0.18em] text-accent hover:text-ink disabled:text-ink-faint disabled:opacity-50 transition-colors duration-[var(--duration-base)]"
        >
          {busy ? "salvando…" : "criar"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={busy}
          className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
        >
          cancelar
        </button>
      </div>
    </form>
  );
}
