import type { Bot } from "grammy";
import { GrammyError } from "grammy";
import { Prisma, prisma } from "@cofri/db";
import { formatFixedExpenseReminder } from "./format.js";

const TZ = "America/Sao_Paulo";

type DayInTZ = { year: number; month: number; day: number };

function dayInTZ(d: Date, tz: string = TZ): DayInTZ {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

function daysInMonth(year: number, month: number): number {
  // month 1-12. Day 0 do mês seguinte = último dia do mês corrente.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calcula o próximo vencimento (em SP) >= hoje, considerando que
 * dueDay pode ser maior que o número de dias do mês (ex.: dueDay=31
 * em fevereiro vira o último dia do mês).
 */
function nextDueDate(today: DayInTZ, dueDay: number): DayInTZ {
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

function diffInDays(a: DayInTZ, b: DayInTZ): number {
  const aUTC = Date.UTC(a.year, a.month - 1, a.day);
  const bUTC = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((aUTC - bUTC) / 86_400_000);
}

function periodOf(d: DayInTZ): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}`;
}

const BATCH_LIMIT = 200;

/**
 * Varre contas fixas ativas e dispara mensagens nos dias-aviso (leadDays).
 * Dedup via FixedExpenseNotification (unique em [fixedExpenseId, period, leadDay]).
 *
 * Roda no mesmo loop do notifier de Reminder (intervalo 60s). Idempotente.
 */
export async function processDueFixedExpenses(bot: Bot): Promise<void> {
  const today = dayInTZ(new Date());

  const rows = await prisma.fixedExpense.findMany({
    where: { active: true },
    include: { user: true },
    take: BATCH_LIMIT,
  });

  if (rows.length === 0) return;

  let sent = 0;
  for (const fe of rows) {
    const due = nextDueDate(today, fe.dueDay);
    const daysUntil = diffInDays(due, today);

    // Só dispara se hoje for um dos lead days configurados.
    if (!fe.leadDays.includes(daysUntil)) continue;

    const period = periodOf(due);

    // Tenta criar o registro de notificação. Se já existe (unique violation),
    // alguém — talvez este próprio loop num tick anterior — já enviou.
    try {
      await prisma.fixedExpenseNotification.create({
        data: {
          fixedExpenseId: fe.id,
          period,
          leadDay: daysUntil,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }

    const message = formatFixedExpenseReminder({
      name: fe.name,
      amount: fe.amount.toNumber(),
      dueDay: fe.dueDay,
      daysUntil,
      category: fe.category,
    });

    try {
      await bot.api.sendMessage(Number(fe.user.telegramId), message);
      sent++;
    } catch (err) {
      // Reverte o registro de notificação se foi falha transitória, pra que
      // o próximo tick tente de novo. Em falha permanente (ex.: usuário
      // bloqueou o bot), deixa registrado pra não repetir tentativas.
      if (!isPermanentTelegramError(err)) {
        await prisma.fixedExpenseNotification
          .deleteMany({
            where: { fixedExpenseId: fe.id, period, leadDay: daysUntil },
          })
          .catch(() => {});
      }
      console.error(
        `[fixed-notifier] failed to notify fe=${fe.id} (${describeError(err)})`,
      );
    }
  }

  if (sent > 0) {
    console.log(
      `[fixed-notifier] dispatched ${sent} fixed-expense reminder(s) at ${new Date().toISOString()}`,
    );
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

function isPermanentTelegramError(err: unknown): boolean {
  if (!(err instanceof GrammyError)) return false;
  return err.error_code >= 400 && err.error_code < 500;
}

function describeError(err: unknown): string {
  if (err instanceof GrammyError) {
    return `Telegram ${err.error_code}: ${err.description}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
