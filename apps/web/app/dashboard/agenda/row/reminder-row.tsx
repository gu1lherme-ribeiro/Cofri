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
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-4 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:gap-x-6">
            <span className="font-mono text-xs tracking-wider text-negative uppercase">
              excluir?
            </span>
            <p className="text-ink-muted truncate min-w-0 flex-1 basis-full sm:basis-auto">
              {localText}
            </p>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em] py-1">
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
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="group grid items-baseline grid-cols-[minmax(0,1fr)_auto_1.5rem] gap-x-3 gap-y-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto_1.25rem] sm:gap-x-6 sm:gap-y-0 sm:py-4">
            {/* data/hora: mobile → linha 2 full; desktop → linha 1 col 1 */}
            <div className="row-start-2 col-span-3 sm:row-start-1 sm:col-start-1 sm:col-span-1">
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
            </div>
            {/* texto: mobile → linha 1 col 1; desktop → col 2 */}
            <div className="row-start-1 col-start-1 min-w-0 sm:col-start-2">
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
            </div>
            {/* relativo ("em 2h"): mobile → linha 1 col 2; desktop → col 3 */}
            <span
              className={`row-start-1 col-start-2 sm:col-start-3 font-mono text-[11px] uppercase tracking-[0.15em] ${
                passed ? "text-ink-faint" : "text-ink-muted"
              }`}
            >
              {relative ?? ""}
            </span>
            <button
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label="Excluir lembrete"
              className="row-start-1 col-start-3 sm:col-start-4 text-ink-faint hover:text-negative md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
