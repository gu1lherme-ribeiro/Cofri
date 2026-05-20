import { requireSessionUserId } from "@/lib/session";
import { listFixedExpenses } from "@/lib/fixed-expenses";
import { loadUserCategories } from "@/lib/categories";
import { FixedExpensesList } from "./fixed-expenses-list";

export const dynamic = "force-dynamic";

export default async function ContasFixasPage() {
  const userId = await requireSessionUserId();
  const [items, categories] = await Promise.all([
    listFixedExpenses(userId),
    loadUserCategories(userId),
  ]);

  const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL;

  return (
    <FixedExpensesList
      initialItems={items}
      categories={categories}
      wsUrl={wsUrl}
    />
  );
}
