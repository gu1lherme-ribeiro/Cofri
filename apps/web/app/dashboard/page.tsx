import { requireSessionUserId } from "@/lib/session";
import {
  listTransactions,
  transactionFiltersSchema,
} from "@/lib/transactions";
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
  const items = await listTransactions(userId, filters);
  const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL;

  return (
    <RealtimeDashboard
      initialItems={items}
      filters={filters}
      filterUiCurrent={{ category: sp.category, kind: sp.kind }}
      filterRevision={`${sp.kind ?? ""}|${sp.category ?? ""}`}
      wsUrl={wsUrl}
    />
  );
}
