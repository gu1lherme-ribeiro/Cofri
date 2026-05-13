import { prisma } from "@cofri/db";
import { CATEGORIES } from "./transactions";

const TZ_OFFSET_MS = -3 * 60 * 60 * 1000; // America/Sao_Paulo (-03:00, sem DST atual)

export type CategorySlice = {
  category: string;
  total: number;
};

export type DailyPoint = {
  /** ISO date "YYYY-MM-DD" no TZ de SP */
  date: string;
  expense: number;
  income: number;
};

function startOfMonthSP(now = new Date()): Date {
  const sp = new Date(now.getTime() + TZ_OFFSET_MS);
  return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), 1) - TZ_OFFSET_MS);
}

function endOfMonthSP(now = new Date()): Date {
  const sp = new Date(now.getTime() + TZ_OFFSET_MS);
  return new Date(
    Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth() + 1, 1) - TZ_OFFSET_MS,
  );
}

function spDateKey(d: Date): string {
  const sp = new Date(d.getTime() + TZ_OFFSET_MS);
  const y = sp.getUTCFullYear();
  const m = String(sp.getUTCMonth() + 1).padStart(2, "0");
  const day = String(sp.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function categoryBreakdown(
  userId: string,
): Promise<CategorySlice[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      kind: "expense",
      occurredAt: { gte: startOfMonthSP(), lt: endOfMonthSP() },
    },
    select: { category: true, amount: true },
  });

  const totals = new Map<string, number>();
  for (const r of rows) {
    const prev = totals.get(r.category) ?? 0;
    totals.set(r.category, prev + r.amount.toNumber());
  }

  return CATEGORIES.map((c) => ({
    category: c,
    total: totals.get(c) ?? 0,
  })).filter((s) => s.total > 0);
}

const DEFAULT_DAYS = 30;

export async function dailySeries(
  userId: string,
  days = DEFAULT_DAYS,
): Promise<DailyPoint[]> {
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);

  const rows = await prisma.transaction.findMany({
    where: { userId, occurredAt: { gte: from } },
    select: { amount: true, kind: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  });

  // Bucket por dia em SP
  const buckets = new Map<string, { expense: number; income: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(now.getTime() - i * 86_400_000);
    buckets.set(spDateKey(d), { expense: 0, income: 0 });
  }

  for (const r of rows) {
    const key = spDateKey(r.occurredAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const v = r.amount.toNumber();
    if (r.kind === "expense") bucket.expense += v;
    else bucket.income += v;
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));
}
