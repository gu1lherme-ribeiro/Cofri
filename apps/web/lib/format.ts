const TZ = "America/Sao_Paulo";

export const moneyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const moneyNumberFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dayMonthShort = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});

const monthLong = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  month: "long",
});

export function formatMoney(value: number): string {
  return moneyFmt.format(value);
}

/** "1.950,00" — sem prefixo de moeda, com separadores PT-BR. */
export function formatAmount(value: number): string {
  return moneyNumberFmt.format(value);
}

/** "13.MAI" — data tabular curta em caixa-alta. */
export function formatDayMonth(iso: string): string {
  const parts = dayMonthShort.formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month =
    parts.find((p) => p.type === "month")?.value.replace(/\./g, "") ?? "";
  return `${day}.${month.toUpperCase()}`;
}

/** "Maio" (mês corrente, capitalizado). */
export function currentMonthLabel(now = new Date()): string {
  const raw = monthLong.format(now);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

/** "09h00" — formato curto de hora em pt-BR. */
export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso)).replace(":", "h");
}

function startOfDaySP(d: Date): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return Date.UTC(y, m - 1, day);
}

/**
 * Descritor relativo a partir de hoje:
 * "hoje", "amanhã", "em 3 dias", "ontem", "há 5 dias", ou null pra distâncias grandes.
 */
export function formatRelativeFromNow(iso: string): string | null {
  const target = startOfDaySP(new Date(iso));
  const today = startOfDaySP(new Date());
  const diff = Math.round((target - today) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 1 && diff <= 30) return `em ${diff} dias`;
  if (diff < -1 && diff >= -30) return `há ${-diff} dias`;
  return null;
}
