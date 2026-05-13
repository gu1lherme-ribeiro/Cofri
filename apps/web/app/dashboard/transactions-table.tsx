"use client";

import { useMemo } from "react";
import type { SerializedTransaction } from "@/lib/transactions";
import { TransactionRow } from "./row/transaction-row";

type Props = {
  items: SerializedTransaction[];
  /**
   * Identifica a "versão" do conjunto filtrado. Quando muda, força remount
   * do <ul> e dispara o fade-in.
   */
  revision?: string;
};

export function TransactionsTable({ items, revision }: Props) {
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [items],
  );

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center animate-fade-in" key={`empty-${revision}`}>
        <p className="text-ink-muted">
          Nada registrado neste período.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Manda no Telegram algo como{" "}
          <span className="font-mono text-ink-muted">
            &ldquo;gastei 45 no almoço&rdquo;
          </span>{" "}
          — aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <ul key={revision} className="divide-y divide-rule animate-fade-in">
      {sorted.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </ul>
  );
}
