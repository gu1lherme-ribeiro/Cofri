"use client";

import type { SerializedReminder } from "@/lib/reminders";
import { ReminderRow } from "./row/reminder-row";

type Props = {
  items: SerializedReminder[];
  scope: "upcoming" | "past" | "all";
};

export function RemindersList({ items, scope }: Props) {
  if (items.length === 0) {
    const message =
      scope === "past"
        ? "Nenhum lembrete passado por aqui."
        : scope === "all"
          ? "Nenhum lembrete ainda."
          : "Nenhum lembrete agendado.";
    return (
      <div className="py-16 text-center animate-fade-in" key={`empty-${scope}`}>
        <p className="text-ink-muted">{message}</p>
        <p className="mt-2 text-xs text-ink-faint">
          Manda no Telegram algo como{" "}
          <span className="font-mono text-ink-muted">
            &ldquo;lembrar de pagar luz dia 20&rdquo;
          </span>{" "}
          — aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <ul key={scope} className="divide-y divide-rule animate-fade-in">
      {items.map((r) => (
        <ReminderRow key={r.id} reminder={r} />
      ))}
    </ul>
  );
}
