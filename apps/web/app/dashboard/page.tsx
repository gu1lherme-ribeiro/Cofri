import { requireSessionUserId } from "@/lib/session";
import {
  listTransactions,
  transactionFiltersSchema,
} from "@/lib/transactions";
import { loadUserCategories } from "@/lib/categories";
import { RealtimeDashboard } from "./realtime-dashboard";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  kind?: string;
  from?: string;
  to?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await requireSessionUserId();
  const sp = await searchParams;

  const parsed = transactionFiltersSchema.safeParse({
    category: sp.category,
    kind: sp.kind,
    from: sp.from,
    to: sp.to,
  });

  const filters = parsed.success ? parsed.data : {};

  // Servidor busca o mês inteiro (só filtros de data são aplicados no SQL).
  // Os filtros kind/category são aplicados no cliente via useMemo — clicar em
  // "Tudo"/"Gastos"/"Receitas"/categoria não faz round-trip pro server.
  const fetchFilters = {
    from: filters.from,
    to: filters.to,
  };

  const [items, availableCategories] = await Promise.all([
    listTransactions(userId, fetchFilters),
    loadUserCategories(userId),
  ]);
  const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL;

  return (
    <RealtimeDashboard
      initialItems={items}
      initialKind={filters.kind ?? ""}
      initialCategory={filters.category ?? ""}
      dateFilters={fetchFilters}
      availableCategories={availableCategories}
      wsUrl={wsUrl}
    />
  );
}
