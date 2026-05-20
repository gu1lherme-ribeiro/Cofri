import { requireSessionUserId } from "@/lib/session";
import { listReminders, reminderFiltersSchema } from "@/lib/reminders";
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

  // Server entrega TODOS os lembretes — o cliente filtra por scope via state
  // e deriva os totais (upcoming/past) a partir dos próprios items, o que
  // permite que o WS empurre lembretes novos sem ficar fora de sincronia.
  const items = await listReminders(userId, { scope: "all" });

  const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL;

  return (
    <AgendaClient
      initialItems={items}
      initialScope={scope}
      wsUrl={wsUrl}
    />
  );
}
