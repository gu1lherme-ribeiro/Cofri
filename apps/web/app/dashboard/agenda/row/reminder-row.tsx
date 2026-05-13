"use client";

import { useState } from "react";
import { formatRelativeFromNow } from "@/lib/format";
import type { SerializedReminder } from "@/lib/reminders";
import { EditableReminderDateTime } from "./editable-reminder-datetime";
import { EditableReminderText } from "./editable-reminder-text";
import { useMutateReminder } from "./use-mutate-reminder";

type Props = {
  reminder: SerializedReminder;
};

export function ReminderRow({ reminder }: Props) {
  const { update, remove, pending } = useMutateReminder(reminder.id);
  const [confirming, setConfirming] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [localDueAt, setLocalDueAt] = useState(reminder.dueAt);
  const [localText, setLocalText] = useState(reminder.text);

  const passed = new Date(localDueAt).getTime() < Date.now();
  const relative = formatRelativeFromNow(localDueAt);

  return (
    <li
      className="collapsible"
      data-collapsed={collapsing || undefined}
      aria-hidden={collapsing || undefined}
    >
      <div>
        {confirming ? (
          <div className="grid grid-cols-[10rem_1fr_auto] gap-x-6 py-4 items-baseline">
            <span className="font-mono text-xs tracking-wider text-negative uppercase">
              excluir?
            </span>
            <p className="text-ink-muted truncate">{localText}</p>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em]">
              <button
                onClick={async () => {
                  setCollapsing(true);
                  try {
                    await remove();
                  } catch {
                    setCollapsing(false);
                    setConfirming(false);
                  }
                }}
                disabled={pending}
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)]"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="group grid grid-cols-[10rem_1fr_auto_1.25rem] gap-x-6 py-4 items-baseline">
            <EditableReminderDateTime
              value={localDueAt}
              pending={pending}
              passed={passed}
              onSave={async (dueAt) => {
                setLocalDueAt(dueAt);
                try {
                  await update({ dueAt });
                } catch (e) {
                  setLocalDueAt(reminder.dueAt);
                  throw e;
                }
              }}
            />
            <EditableReminderText
              value={localText}
              pending={pending}
              passed={passed}
              onSave={async (text) => {
                setLocalText(text);
                try {
                  await update({ text });
                } catch (e) {
                  setLocalText(reminder.text);
                  throw e;
                }
              }}
            />
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.15em] ${
                passed ? "text-ink-faint" : "text-ink-muted"
              }`}
            >
              {relative ?? ""}
            </span>
            <button
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label="Excluir lembrete"
              className="text-ink-faint hover:text-negative opacity-0 group-hover:opacity-100 focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
