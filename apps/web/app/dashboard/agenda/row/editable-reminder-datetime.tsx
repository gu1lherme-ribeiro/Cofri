"use client";

import { useState } from "react";
import { formatDayMonth, formatTime } from "@/lib/format";

type Props = {
  value: string;
  pending?: boolean;
  passed?: boolean;
  onSave: (next: string) => Promise<void>;
};

const TZ = "America/Sao_Paulo";

function toInputValue(iso: string): string {
  // datetime-local quer "YYYY-MM-DDTHH:MM" sem timezone, mas referente ao tz local do user.
  // Como queremos manter -03:00, calculamos manualmente os componentes em SP.
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${y}-${m}-${day}T${hh === "24" ? "00" : hh}:${mm}`;
}

function fromInputValue(local: string): string {
  // local = "YYYY-MM-DDTHH:MM" (sem TZ) — interpretamos como horário de SP (-03:00).
  const [date, time] = local.split("T");
  if (!date || !time) return new Date().toISOString();
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || hh === undefined || mm === undefined) {
    return new Date().toISOString();
  }
  // SP é UTC-3 (sem DST atualmente).
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm)).toISOString();
}

export function EditableReminderDateTime({
  value,
  pending,
  passed,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [error, setError] = useState(false);

  async function commit(raw: string) {
    setEditing(false);
    if (!raw) return;
    const nextIso = fromInputValue(raw);
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
        type="datetime-local"
        defaultValue={toInputValue(local)}
        disabled={pending}
        onBlur={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="bg-canvas text-ink font-mono text-xs outline-none border-b border-accent"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`font-mono text-xs tracking-wider tabular-nums hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
        error ? "text-negative" : passed ? "text-ink-faint opacity-70" : "text-ink-faint"
      } ${pending ? "opacity-60" : ""}`}
      title="Clicar para mudar data e hora"
    >
      {formatDayMonth(local)} · {formatTime(local)}
    </button>
  );
}
