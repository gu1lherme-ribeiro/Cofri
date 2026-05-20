"use client";

import { useState } from "react";
import type { SerializedFixedExpense } from "@/lib/fixed-expenses";
import { AddFixedExpenseForm } from "./add-fixed-expense-form";
import { FixedExpenseRow } from "./fixed-expense-row";

type Props = {
  initialItems: SerializedFixedExpense[];
  categories: string[];
};

export function FixedExpensesList({ initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);

  function handleCreated(item: SerializedFixedExpense) {
    setItems((curr) => [...curr, item]);
  }

  function handleUpdated(item: SerializedFixedExpense) {
    setItems((curr) => curr.map((i) => (i.id === item.id ? item : i)));
  }

  function handleDeleted(id: string) {
    setItems((curr) => curr.filter((i) => i.id !== id));
  }

  const active = items
    .filter((i) => i.active)
    .sort(
      (a, b) =>
        a.dueDay - b.dueDay ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const paused = items
    .filter((i) => !i.active)
    .sort(
      (a, b) =>
        a.dueDay - b.dueDay ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  return (
    <>
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
        </>
      )}

      <AddFixedExpenseForm
        categories={categories}
        onCreated={handleCreated}
      />
    </>
  );
}
