import { requireSessionUserId } from "@/lib/session";
import {
  countReminders,
  listReminders,
  reminderFiltersSchema,
} from "@/lib/reminders";
import { RemindersList } from "./reminders-list";
import { ScopeFilter } from "./scope-filter";

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

  const [items, totals] = await Promise.all([
    listReminders(userId, { scope }),
    countReminders(userId),
  ]);

  const heroNumber = scope === "past" ? totals.past : totals.upcoming;
  const heroLabel =
    scope === "past"
      ? heroNumber === 1
        ? "lembrete passado"
        : "lembretes passados"
      : heroNumber === 1
        ? "lembrete agendado"
        : "lembretes agendados";

  return (
    <>
      <section className="mb-12 sm:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">
          {scope === "all" ? "Todos os lembretes" : heroLabel.replace(/^[a-z]+ /, "Total ")}
        </p>
        <p className="font-mono text-[2.5rem] sm:text-[3.25rem] leading-none tabular-nums text-ink">
          {scope === "all" ? totals.upcoming + totals.past : heroNumber}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:gap-x-8 mt-4 font-mono text-sm tabular-nums">
          <span className="text-ink-muted">
            <span className="text-positive">{totals.upcoming}</span>
            <span className="ml-1.5 text-ink-faint">
              {totals.upcoming === 1 ? "próximo" : "próximos"}
            </span>
          </span>
          <span className="text-ink-muted">
            <span className="text-ink-faint">{totals.past}</span>
            <span className="ml-1.5 text-ink-faint">passados</span>
          </span>
        </div>
      </section>

      <ScopeFilter current={scope} />

      <RemindersList items={items} scope={scope} />
    </>
  );
}
