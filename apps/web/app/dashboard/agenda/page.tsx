import { requireSessionUserId } from "@/lib/session";
import {
  countReminders,
  listReminders,
  reminderFiltersSchema,
} from "@/lib/reminders";
import { AgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

type SearchParams = {
  scope?: string;
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await requireSessionUserId();
  const sp = await searchParams;

  const parsed = reminderFiltersSchema.safeParse({ scope: sp.scope });
  const scope = parsed.success ? parsed.data.scope ?? "upcoming" : "upcoming";

  // Server entrega TODOS os lembretes — o cliente filtra por scope via state.
  // Trocar "Próximos/Passados/Tudo" deixa de fazer SSR round-trip.
  const [items, totals] = await Promise.all([
    listReminders(userId, { scope: "all" }),
    countReminders(userId),
  ]);

  return (
    <AgendaClient initialItems={items} totals={totals} initialScope={scope} />
  );
}
