"use client";

import { useCallback, useMemo, useState } from "react";
import type { SerializedFixedExpense } from "@/lib/fixed-expenses";
import { formatAmount } from "@/lib/format";
import { useCountUp } from "@/lib/hooks/use-count-up";
import {
  useRealtime,
  type RealtimeEvent,
} from "@/lib/hooks/use-realtime";
import { AddFixedExpenseForm } from "./add-fixed-expense-form";
import { FixedExpenseRow } from "./fixed-expense-row";

type Props = {
  initialItems: SerializedFixedExpense[];
  categories: string[];
  wsUrl?: string;
};

export function FixedExpensesList({ initialItems, categories, wsUrl }: Props) {
  const [items, setItems] = useState(initialItems);

  function handleCreated(item: SerializedFixedExpense) {
    setItems((curr) =>
      curr.some((i) => i.id === item.id) ? curr : [...curr, item],
    );
  }

  function handleUpdated(item: SerializedFixedExpense) {
    setItems((curr) => curr.map((i) => (i.id === item.id ? item : i)));
  }

  function handleDeleted(id: string) {
    setItems((curr) => curr.filter((i) => i.id !== id));
  }

  const handleEvent = useCallback((evt: RealtimeEvent) => {
    if (evt.type === "fixed_expense.created") {
      const fe = evt.payload;
      setItems((curr) =>
        curr.some((i) => i.id === fe.id) ? curr : [...curr, fe],
      );
      return;
    }
    if (evt.type === "fixed_expense.completed") {
      const { id, completedAt } = evt.payload;
      setItems((curr) =>
        curr.map((i) =>
          i.id === id ? { ...i, completedAt, active: false } : i,
        ),
      );
      return;
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    try {
      const res = await fetch("/api/fixed-expenses", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: SerializedFixedExpense[] };
      setItems(data.items);
    } catch {
      // próxima reconexão tentará de novo
    }
  }, []);

  useRealtime(wsUrl, handleEvent, { onReconnect: handleReconnect });

  const { active, paused, completed, totalMonthly } = useMemo(() => {
    const sortFn = (a: SerializedFixedExpense, b: SerializedFixedExpense) =>
      a.dueDay - b.dueDay ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    // Concluídas (completedAt) saem das listas Ativas/Pausadas e vão pra
    // própria seção, ordenadas pelo dia da conclusão (mais recente primeiro).
    const completed = items
      .filter((i) => i.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      );
    const live = items.filter((i) => !i.completedAt);
    const active = live.filter((i) => i.active).sort(sortFn);
    const paused = live.filter((i) => !i.active).sort(sortFn);
    const totalMonthly = active.reduce((s, i) => s + i.amount, 0);
    return { active, paused, completed, totalMonthly };
  }, [items]);

  const animTotalMonthly = useCountUp(totalMonthly);

  return (
    <>
      <section className="mb-12 sm:mb-14 lg:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
          Compromisso mensal
        </p>
        <p
          className="font-mono leading-tight sm:leading-none tabular-nums text-ink break-words"
          style={{ fontSize: "var(--text-hero-compact)" }}
        >
          {active.length > 0 ? (
            <span className="text-ink">R$ {formatAmount(animTotalMonthly)}</span>
          ) : (
            <span className="text-ink-faint">—</span>
          )}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:gap-x-8 mt-4 font-mono text-sm tabular-nums">
          <span className="text-ink-muted">
            <span className="text-ink">{active.length}</span>
            <span className="ml-1.5 text-ink-faint">
              {active.length === 1 ? "ativa" : "ativas"}
            </span>
          </span>
          {paused.length > 0 && (
            <span className="text-ink-muted">
              <span className="text-ink-faint">{paused.length}</span>
              <span className="ml-1.5 text-ink-faint">pausadas</span>
            </span>
          )}
          {completed.length > 0 && (
            <span className="text-ink-muted">
              <span className="text-positive">{completed.length}</span>
              <span className="ml-1.5 text-ink-faint">
                {completed.length === 1 ? "concluída" : "concluídas"}
              </span>
            </span>
          )}
        </div>
      </section>

      {items.length === 0 ? (
        <div className="border-t border-rule pt-10">
          <p className="font-mono text-sm text-ink-muted leading-relaxed">
            Nenhuma conta fixa cadastrada ainda. Use o formulário abaixo ou
            mande pro bot uma mensagem como{" "}
            <span className="text-ink">&ldquo;Faculdade 800 todo dia 10&rdquo;</span>{" "}
            — eu cadastro automaticamente e mando lembretes nos dias-aviso.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Ativas
              </p>
              <ul className="border-t border-rule">
                {active.map((row) => (
                  <li key={row.id} className="border-b border-rule">
                    <FixedExpenseRow
                      initial={row}
                      categories={categories}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {paused.length > 0 && (
            <>
              <p className="mt-10 mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Pausadas
              </p>
              <ul className="border-t border-rule">
                {paused.map((row) => (
                  <li key={row.id} className="border-b border-rule">
                    <FixedExpenseRow
                      initial={row}
                      categories={categories}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {completed.length > 0 && (
            <>
              <p className="mt-10 mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Concluídas
              </p>
              <ul className="border-t border-rule">
                {completed.map((row) => (
                  <li key={row.id} className="border-b border-rule">
                    <FixedExpenseRow
                      initial={row}
                      categories={categories}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <AddFixedExpenseForm
        categories={categories}
        onCreated={handleCreated}
      />
    </>
  );
}
