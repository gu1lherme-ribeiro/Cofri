"use client";

import { useState } from "react";
import { formatAmount } from "@/lib/format";

type Props = {
  value: number;
  kind: "expense" | "income";
  pending?: boolean;
  onSave: (next: number) => Promise<void>;
};

function parseInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function EditableAmount({ value, kind, pending, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [error, setError] = useState(false);

  const sign = kind === "expense" ? "−" : "+";
  const colorClass = kind === "expense" ? "text-negative" : "text-positive";

  async function commit(raw: string) {
    setEditing(false);
    const parsed = parseInput(raw);
    if (parsed === null || parsed === value) {
      setLocal(value);
      return;
    }
    const prev = local;
    setLocal(parsed);
    setError(false);
    try {
      await onSave(parsed);
    } catch {
      setLocal(prev);
      setError(true);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        defaultValue={local.toString().replace(".", ",")}
        disabled={pending}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-28 bg-transparent text-right font-mono tabular-nums outline-none border-b border-accent pb-px -mb-px ${colorClass}`}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`font-mono tabular-nums text-right hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${colorClass} ${
        error ? "ring-1 ring-negative" : ""
      } ${pending ? "opacity-60" : ""}`}
      title="Clicar para editar valor"
    >
      <span className="opacity-70 mr-1">{sign}</span>
      {formatAmount(local)}
    </button>
  );
}
