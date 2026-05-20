"use client";

import { useState } from "react";
import type { SerializedFixedExpense } from "@/lib/fixed-expenses";
import { LeadDaysPicker } from "./lead-days-picker";

const DEFAULT_LEAD = [1, 2];

type DurationKind = "recurring" | "installments" | "endMonth";

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

function parseInstallments(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 2 || n > 120) return null;
  return n;
}

// "12/2027" ou "12/27" → "2027-12". Aceita também "2027-12" direto.
function parseEndMonth(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const slash = /^(\d{1,2})\/(\d{2}|\d{4})$/.exec(t);
  if (slash) {
    const month = Number(slash[1]);
    let year = Number(slash[2]);
    if (month < 1 || month > 12) return null;
    if (year < 100) year = 2000 + year;
    if (year < 2000 || year > 2100) return null;
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  const iso = /^(\d{4})-(\d{2})$/.exec(t);
  if (iso) {
    const month = Number(iso[2]);
    if (month < 1 || month > 12) return null;
    return t;
  }
  return null;
}

type Props = {
  categories: string[];
  onCreated: (item: SerializedFixedExpense) => void;
};

export function AddFixedExpenseForm({ categories, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "casa");
  const [leadDays, setLeadDays] = useState<number[]>(DEFAULT_LEAD);
  const [durationKind, setDurationKind] = useState<DurationKind>("recurring");
  const [installments, setInstallments] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setAmount("");
    setDueDay("");
    setCategory(categories[0] ?? "casa");
    setLeadDays(DEFAULT_LEAD);
    setDurationKind("recurring");
    setInstallments("");
    setEndMonth("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const parsedAmount = parseAmount(amount);
    const parsedDay = parseDay(dueDay);

    if (!trimmedName) {
      setError("Informe o nome da conta.");
      return;
    }
    if (parsedAmount === null) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (parsedDay === null) {
      setError("Informe um dia válido (1 a 31).");
      return;
    }
    if (leadDays.length === 0) {
      setError("Selecione ao menos um dia de aviso.");
      return;
    }

    let duration: unknown = { kind: "recurring" };
    if (durationKind === "installments") {
      const parsedN = parseInstallments(installments);
      if (parsedN === null) {
        setError("Informe um número de parcelas entre 2 e 120.");
        return;
      }
      duration = { kind: "installments", total: parsedN };
    } else if (durationKind === "endMonth") {
      const parsedEnd = parseEndMonth(endMonth);
      if (!parsedEnd) {
        setError("Informe um mês/ano válido (ex.: 12/2027).");
        return;
      }
      duration = { kind: "endMonth", endMonth: parsedEnd };
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/fixed-expenses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          amount: parsedAmount,
          dueDay: parsedDay,
          category,
          leadDays,
          duration,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "invalid_name"
            ? "Nome inválido. Use letras, números, espaço, hífen ou _."
            : j.error === "invalid_category"
              ? "Categoria inválida."
              : j.error === "invalid_end_month"
                ? "Mês final inválido ou muito distante."
                : "Não consegui cadastrar.",
        );
        return;
      }
      const { item } = (await res.json()) as { item: SerializedFixedExpense };
      onCreated(item);
      reset();
      setOpen(false);
    } catch {
      setError("Não consegui cadastrar.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-accent transition-colors duration-[var(--duration-base)]"
      >
        + cadastrar conta fixa
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 border border-rule rounded-[var(--radius-card)] p-4 sm:p-5 space-y-4"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        Nova conta fixa
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <label
            htmlFor="new-fe-name"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Nome
          </label>
          <input
            id="new-fe-name"
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Faculdade, Aluguel, Netflix…"
            disabled={saving}
            maxLength={40}
            className="w-full bg-transparent text-ink border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="new-fe-amount"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Valor mensal (R$)
          </label>
          <input
            id="new-fe-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            disabled={saving}
            className="w-full bg-transparent text-ink font-mono tabular-nums border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="new-fe-day"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Dia do vencimento
          </label>
          <input
            id="new-fe-day"
            type="text"
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="1 a 31"
            disabled={saving}
            maxLength={2}
            className="w-full bg-transparent text-ink font-mono tabular-nums border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="new-fe-category"
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
          >
            Categoria
          </label>
          <select
            id="new-fe-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
            className="w-full bg-transparent text-ink border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)] capitalize"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize bg-surface text-ink">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-2">
          Duração
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
          {([
            ["recurring", "recorrente sem prazo"],
            ["installments", "parcelado (Nx)"],
            ["endMonth", "com prazo final"],
          ] as const).map(([kind, label]) => (
            <label
              key={kind}
              className="flex items-center gap-2 cursor-pointer text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
            >
              <input
                type="radio"
                name="duration-kind"
                value={kind}
                checked={durationKind === kind}
                onChange={() => setDurationKind(kind)}
                disabled={saving}
                className="accent-accent"
              />
              <span className={durationKind === kind ? "text-ink" : ""}>
                {label}
              </span>
            </label>
          ))}
        </div>

        {durationKind === "installments" && (
          <div className="mt-3 max-w-[180px]">
            <label
              htmlFor="new-fe-installments"
              className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
            >
              Total de parcelas
            </label>
            <input
              id="new-fe-installments"
              type="text"
              inputMode="numeric"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              placeholder="ex.: 12"
              disabled={saving}
              maxLength={3}
              className="w-full bg-transparent text-ink font-mono tabular-nums border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
            />
            <p className="mt-1 font-mono text-[10px] text-ink-faint leading-relaxed">
              A 1ª parcela é o próximo vencimento; o bot te parabeniza quando a
              última for paga.
            </p>
          </div>
        )}

        {durationKind === "endMonth" && (
          <div className="mt-3 max-w-[180px]">
            <label
              htmlFor="new-fe-endmonth"
              className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-1"
            >
              Último mês (MM/AAAA)
            </label>
            <input
              id="new-fe-endmonth"
              type="text"
              inputMode="numeric"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              placeholder="ex.: 12/2027"
              disabled={saving}
              maxLength={7}
              className="w-full bg-transparent text-ink font-mono tabular-nums border-b border-rule focus:border-accent outline-none py-1.5 transition-colors duration-[var(--duration-base)]"
            />
            <p className="mt-1 font-mono text-[10px] text-ink-faint leading-relaxed">
              A conta dura do próximo vencimento até esse mês, inclusive.
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mb-2">
          Dias de aviso antes do vencimento
        </p>
        <LeadDaysPicker value={leadDays} onChange={setLeadDays} disabled={saving} />
        <p className="mt-2 font-mono text-[10px] text-ink-faint leading-relaxed">
          O bot vai te avisar nos dias selecionados antes do vencimento. Pra
          dia 10 com aviso de 2 e 1: lembretes saem dia 8 e dia 9.
        </p>
      </div>

      {error && (
        <p className="font-mono text-[11px] text-negative">{error}</p>
      )}

      <div className="flex items-center gap-5 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="font-mono text-xs uppercase tracking-[0.18em] text-accent hover:text-ink disabled:text-ink-faint disabled:opacity-50 transition-colors duration-[var(--duration-base)]"
        >
          {saving ? "salvando…" : "cadastrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={saving}
          className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
        >
          cancelar
        </button>
      </div>
    </form>
  );
}
