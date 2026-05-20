"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SerializedReminder } from "@/lib/reminders";
import {
  useRealtime,
  type RealtimeEvent,
} from "@/lib/hooks/use-realtime";
import { RemindersList } from "./reminders-list";
import { ScopeFilter } from "./scope-filter";

type Scope = "upcoming" | "past" | "all";

type Props = {
  initialItems: SerializedReminder[];
  initialScope: Scope;
  wsUrl?: string;
};

export function AgendaClient({
  initialItems,
  initialScope,
  wsUrl,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [scope, setScope] = useState<Scope>(initialScope);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  useEffect(() => {
    setScope(initialScope);
  }, [initialScope]);

  const handleEvent = useCallback((evt: RealtimeEvent) => {
    if (evt.type !== "reminder.created") return;
    const r = evt.payload;
    setItems((curr) =>
      curr.some((i) => i.id === r.id) ? curr : [r, ...curr],
    );
  }, []);

  const handleReconnect = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: SerializedReminder[] };
      setItems(data.items);
    } catch {
      // próxima reconexão tentará de novo
    }
  }, []);

  useRealtime(wsUrl, handleEvent, { onReconnect: handleReconnect });

  // Filtra + ordena no cliente. Server entrega todos; troca de scope é
  // instantânea sem round-trip.
  const displayedItems = useMemo(() => {
    const now = Date.now();
    let filtered = items;
    if (scope === "upcoming") {
      filtered = items.filter((r) => new Date(r.dueAt).getTime() >= now);
    } else if (scope === "past") {
      filtered = items.filter((r) => new Date(r.dueAt).getTime() < now);
    }
    return [...filtered].sort((a, b) => {
      const da = new Date(a.dueAt).getTime();
      const db = new Date(b.dueAt).getTime();
      // past: mais recente primeiro; demais: mais próximo primeiro.
      return scope === "past" ? db - da : da - db;
    });
  }, [items, scope]);

  const totals = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let past = 0;
    for (const r of items) {
      if (new Date(r.dueAt).getTime() >= now) upcoming++;
      else past++;
    }
    return { upcoming, past };
  }, [items]);

  const heroNumber =
    scope === "past"
      ? totals.past
      : scope === "all"
        ? totals.upcoming + totals.past
        : totals.upcoming;

  const heroLabel =
    scope === "all"
      ? "Todos os lembretes"
      : scope === "past"
        ? totals.past === 1
          ? "Total lembrete passado"
          : "Total lembretes passados"
        : totals.upcoming === 1
          ? "Total lembrete agendado"
          : "Total lembretes agendados";

  function handleScopeChange(next: string) {
    const nextScope = next as Scope;
    setScope(nextScope);
    const sp = new URLSearchParams(searchParams);
    if (nextScope === "upcoming") sp.delete("scope");
    else sp.set("scope", nextScope);
    const qs = sp.toString();
    router.replace(qs ? `/dashboard/agenda?${qs}` : "/dashboard/agenda", {
      scroll: false,
    });
  }

  return (
    <>
      <section className="mb-12 sm:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
          {heroLabel}
        </p>
        <p className="font-mono text-[2.5rem] sm:text-[3.25rem] leading-none tabular-nums text-ink">
          {heroNumber}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:gap-x-8 mt-4 font-mono text-sm tabular-nums">
          <span className="text-ink-muted">
            <span className="text-positive">{totals.upcoming}</span>
            <span className="ml-1.5 text-ink-faint">
              {totals.upcoming === 1 ? "próximo" : "próximos"}
            </span>
          </span>
          <span className="text-ink-muted">
            <span className="text-ink-faint">{totals.past}</span>
            <span className="ml-1.5 text-ink-faint">passados</span>
          </span>
        </div>
      </section>

      <ScopeFilter scope={scope} onScopeChange={handleScopeChange} />

      <RemindersList items={displayedItems} scope={scope} />
    </>
  );
}
