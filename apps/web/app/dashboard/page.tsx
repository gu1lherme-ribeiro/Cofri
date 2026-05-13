import { requireSessionUserId } from "@/lib/session";
import {
  computeTotals,
  listTransactions,
  transactionFiltersSchema,
} from "@/lib/transactions";
import { currentMonthLabel } from "@/lib/format";
import { DashboardHeader } from "./_components/header";
import { AnimatedTotals } from "./animated-totals";
import { Filters } from "./filters";
import { TransactionsTable } from "./transactions-table";

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
  const totals = computeTotals(items);

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <DashboardHeader contextLabel={currentMonthLabel()} />

        <AnimatedTotals
          income={totals.income}
          expense={totals.expense}
          count={totals.count}
        />

        <Filters current={{ category: sp.category, kind: sp.kind }} />

        <TransactionsTable
          items={items}
          revision={`${sp.kind ?? ""}|${sp.category ?? ""}`}
        />
      </div>
    </main>
  );
}
