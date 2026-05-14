"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeTotals,
  type SerializedTransaction,
  type TransactionFilters,
} from "@/lib/transactions";
import {
  useRealtime,
  type RealtimeEvent,
  type RealtimeTransaction,
} from "@/lib/hooks/use-realtime";
import { AnimatedTotals } from "./animated-totals";
import { Filters } from "./filters";
import { TransactionsTable } from "./transactions-table";

type Props = {
  initialItems: SerializedTransaction[];
  filters: TransactionFilters;
  filterUiCurrent: { category?: string; kind?: string };
  filterRevision: string;
  wsUrl?: string;
};

function matchesFilters(
  tx: RealtimeTransaction,
  filters: TransactionFilters,
): boolean {
  if (filters.kind && tx.kind !== filters.kind) return false;
  if (filters.category && tx.category !== filters.category) return false;

  const occurred = new Date(tx.occurredAt).getTime();
  if (filters.from && occurred < new Date(filters.from).getTime()) return false;
  if (filters.to && occurred >= new Date(filters.to).getTime()) return false;

  // Sem filtro de data explícito, dashboard mostra o mês corrente (UTC).
  if (!filters.from && !filters.to) {
    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    if (occurred < monthStart || occurred >= monthEnd) return false;
  }

  return true;
}

function filtersToQuery(filters: TransactionFilters): string {
  const sp = new URLSearchParams();
  if (filters.kind) sp.set("kind", filters.kind);
  if (filters.category) sp.set("category", filters.category);
  if (filters.from) sp.set("from", filters.from);
  if (filters.to) sp.set("to", filters.to);
  return sp.toString();
}

export function RealtimeDashboard({
  initialItems,
  filters,
  filterUiCurrent,
  filterRevision,
  wsUrl,
}: Props) {
  const [items, setItems] = useState(initialItems);

  // Quando a página re-renderiza (mudou URL/filtros), sincroniza o estado.
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const totals = useMemo(() => computeTotals(items), [items]);

  const handleEvent = useCallback(
    (evt: RealtimeEvent) => {
      if (evt.type !== "transaction.created") return;
      const tx = evt.payload;
      if (!matchesFilters(tx, filters)) return;
      setItems((prev) => (prev.some((i) => i.id === tx.id) ? prev : [tx, ...prev]));
    },
    [filters],
  );

  const handleReconnect = useCallback(async () => {
    try {
      const qs = filtersToQuery(filters);
      const res = await fetch(`/api/transactions${qs ? `?${qs}` : ""}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: SerializedTransaction[] };
      setItems(data.items);
    } catch {
      // próxima reconexão tentará de novo
    }
  }, [filters]);

  useRealtime(wsUrl, handleEvent, { onReconnect: handleReconnect });

  return (
    <>
      <AnimatedTotals
        income={totals.income}
        expense={totals.expense}
        count={totals.count}
      />

      <Filters current={filterUiCurrent} />

      <TransactionsTable items={items} revision={filterRevision} />
    </>
  );
}
