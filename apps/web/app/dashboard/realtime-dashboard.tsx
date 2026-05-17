"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type DateFilters = Pick<TransactionFilters, "from" | "to">;

type Props = {
  initialItems: SerializedTransaction[];
  initialKind: string;
  initialCategory: string;
  dateFilters: DateFilters;
  availableCategories: string[];
  wsUrl?: string;
};

function matchesDateRange(
  tx: RealtimeTransaction,
  dateFilters: DateFilters,
): boolean {
  const occurred = new Date(tx.occurredAt).getTime();
  if (dateFilters.from && occurred < new Date(dateFilters.from).getTime())
    return false;
  if (dateFilters.to && occurred >= new Date(dateFilters.to).getTime())
    return false;
  // Sem from/to explícito, dashboard mostra o mês corrente (UTC).
  if (!dateFilters.from && !dateFilters.to) {
    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    if (occurred < monthStart || occurred >= monthEnd) return false;
  }
  return true;
}

function dateFiltersToQuery(f: DateFilters): string {
  const sp = new URLSearchParams();
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  return sp.toString();
}

export function RealtimeDashboard({
  initialItems,
  initialKind,
  initialCategory,
  dateFilters,
  availableCategories,
  wsUrl,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [kind, setKind] = useState(initialKind);
  const [category, setCategory] = useState(initialCategory);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Quando a página re-renderiza (deep-link com filtros, refresh), sincroniza.
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  useEffect(() => {
    setKind(initialKind);
  }, [initialKind]);
  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Filtra no cliente — instantâneo. items já contém o mês inteiro do server.
  const displayedItems = useMemo(() => {
    return items.filter((tx) => {
      if (kind && tx.kind !== kind) return false;
      if (category && tx.category !== category) return false;
      return true;
    });
  }, [items, kind, category]);

  const totals = useMemo(() => computeTotals(displayedItems), [displayedItems]);

  // Sincroniza URL silenciosamente (sem SSR) pra manter shareability.
  function syncUrl(nextKind: string, nextCategory: string) {
    const next = new URLSearchParams(searchParams);
    if (nextKind) next.set("kind", nextKind);
    else next.delete("kind");
    if (nextCategory) next.set("category", nextCategory);
    else next.delete("category");
    const qs = next.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }

  function handleKindChange(next: string) {
    setKind(next);
    syncUrl(next, category);
  }

  function handleCategoryChange(next: string) {
    setCategory(next);
    syncUrl(kind, next);
  }

  const handleEvent = useCallback(
    (evt: RealtimeEvent) => {
      if (evt.type !== "transaction.created") return;
      const tx = evt.payload;
      // Filtra só por data — kind/category são aplicados no display.
      if (!matchesDateRange(tx, dateFilters)) return;
      setItems((prev) =>
        prev.some((i) => i.id === tx.id) ? prev : [tx, ...prev],
      );
    },
    [dateFilters],
  );

  const handleReconnect = useCallback(async () => {
    try {
      const qs = dateFiltersToQuery(dateFilters);
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
  }, [dateFilters]);

  useRealtime(wsUrl, handleEvent, { onReconnect: handleReconnect });

  const revision = `${kind}|${category}`;

  return (
    <>
      <AnimatedTotals
        income={totals.income}
        expense={totals.expense}
        count={totals.count}
      />

      <Filters
        kind={kind}
        category={category}
        onKindChange={handleKindChange}
        onCategoryChange={handleCategoryChange}
        availableCategories={availableCategories}
      />

      <TransactionsTable
        items={displayedItems}
        revision={revision}
        availableCategories={availableCategories}
      />
    </>
  );
}
