"use client";

import { useState } from "react";
import { formatDayMonth } from "@/lib/format";

type Props = {
  value: string;
  pending?: boolean;
  onSave: (next: string) => Promise<void>;
};

const TZ = "America/Sao_Paulo";

function toInputValue(iso: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso));
}

function combineDateWithOriginalTime(
  dateStr: string,
  originalIso: string,
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return originalIso;
  const original = new Date(originalIso);
  const hh = original.getUTCHours();
  const mm = original.getUTCMinutes();
  return new Date(Date.UTC(y, m - 1, d, hh, mm)).toISOString();
}

export function EditableDate({ value, pending, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [error, setError] = useState(false);

  async function commit(raw: string) {
    setEditing(false);
    if (!raw) return;
    const nextIso = combineDateWithOriginalTime(raw, value);
    if (nextIso === value) return;
    const prev = local;
    setLocal(nextIso);
    setError(false);
    try {
      await onSave(nextIso);
    } catch {
      setLocal(prev);
      setError(true);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="date"
        defaultValue={toInputValue(local)}
        disabled={pending}
        onBlur={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="bg-canvas text-ink font-mono text-xs outline-none border-b border-accent w-24"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`font-mono text-xs tracking-wider tabular-nums hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
        error ? "text-negative" : "text-ink-faint"
      } ${pending ? "opacity-60" : ""}`}
      title="Clicar para mudar a data"
    >
      {formatDayMonth(local)}
    </button>
  );
}
