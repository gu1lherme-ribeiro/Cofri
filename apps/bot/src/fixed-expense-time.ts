const TZ = "America/Sao_Paulo";

export type DayInTZ = { year: number; month: number; day: number };

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dayInTZ(d: Date): DayInTZ {
  const parts = dateFmt.formatToParts(d);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

export function daysInMonth(year: number, month: number): number {
  // month 1-12. Day 0 do mês seguinte = último dia do mês corrente.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Próximo vencimento (em SP) >= today, capando dueDay pelo último dia do mês. */
export function nextDueDate(today: DayInTZ, dueDay: number): DayInTZ {
  const tryMonth = (year: number, month: number): DayInTZ => {
    const cap = Math.min(dueDay, daysInMonth(year, month));
    return { year, month, day: cap };
  };
  const thisMonth = tryMonth(today.year, today.month);
  if (
    thisMonth.year > today.year ||
    thisMonth.month > today.month ||
    (thisMonth.year === today.year &&
      thisMonth.month === today.month &&
      thisMonth.day >= today.day)
  ) {
    return thisMonth;
  }
  const nextMonth =
    today.month === 12
      ? { year: today.year + 1, month: 1 }
      : { year: today.year, month: today.month + 1 };
  return tryMonth(nextMonth.year, nextMonth.month);
}

export function diffInDays(a: DayInTZ, b: DayInTZ): number {
  const aUTC = Date.UTC(a.year, a.month - 1, a.day);
  const bUTC = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((aUTC - bUTC) / 86_400_000);
}

/** "YYYY-MM" do mês informado. */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** Soma `delta` meses a (year, month). Não considera dia. */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const totalIdx = (year * 12 + (month - 1)) + delta;
  const newYear = Math.floor(totalIdx / 12);
  const newMonth = (totalIdx % 12) + 1;
  return { year: newYear, month: newMonth };
}

/**
 * Conta meses entre `from` e `to` inclusivo dos dois extremos.
 * Ex.: from=2026-06, to=2026-06 → 1; from=2026-06, to=2027-05 → 12.
 */
export function monthsInclusive(
  from: { year: number; month: number },
  to: { year: number; month: number },
): number {
  return (to.year - from.year) * 12 + (to.month - from.month) + 1;
}
