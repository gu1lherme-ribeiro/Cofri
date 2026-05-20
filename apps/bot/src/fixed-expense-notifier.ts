import type { Bot } from "grammy";
import { GrammyError } from "grammy";
import { Prisma, prisma } from "@cofri/db";
import { formatFixedExpenseCompleted, formatFixedExpenseReminder } from "./format.js";
import { broadcast } from "./realtime.js";
import {
  addMonths,
  daysInMonth,
  dayInTZ,
  diffInDays,
  monthKey,
  monthsInclusive,
  nextDueDate,
  parseMonthKey,
  type DayInTZ,
} from "./fixed-expense-time.js";

function periodOf(d: DayInTZ): string {
  return monthKey(d.year, d.month);
}

/**
 * Última data de vencimento para contas com prazo finito.
 * Retorna null se a conta não é parcelada.
 */
function lastDueDate(
  installmentsTotal: number | null,
  installmentsStartMonth: string | null,
  dueDay: number,
): DayInTZ | null {
  if (!installmentsTotal || !installmentsStartMonth) return null;
  const start = parseMonthKey(installmentsStartMonth);
  if (!start) return null;
  const last = addMonths(start.year, start.month, installmentsTotal - 1);
  const day = Math.min(dueDay, daysInMonth(last.year, last.month));
  return { year: last.year, month: last.month, day };
}

const BATCH_LIMIT = 200;

/**
 * Varre contas fixas ativas e dispara mensagens nos dias-aviso (leadDays).
 * Dedup via FixedExpenseNotification (unique em [fixedExpenseId, period, leadDay]).
 *
 * Para contas com prazo finito (installmentsTotal preenchido), ao passar do
 * último vencimento envia mensagem de parabéns e arquiva (active=false +
 * completedAt). Roda no mesmo loop do notifier de Reminder (60s). Idempotente.
 */
export async function processDueFixedExpenses(bot: Bot): Promise<void> {
  const today = dayInTZ(new Date());

  const rows = await prisma.fixedExpense.findMany({
    where: { active: true, completedAt: null },
    include: { user: true },
    take: BATCH_LIMIT,
  });

  if (rows.length === 0) return;

  let sent = 0;
  for (const fe of rows) {
    // 1) Conta parcelada chegou ao fim? Envia parabéns e arquiva.
    const lastDue = lastDueDate(
      fe.installmentsTotal,
      fe.installmentsStartMonth,
      fe.dueDay,
    );
    if (lastDue && diffInDays(today, lastDue) > 0) {
      await completeFixedExpense(bot, fe, lastDue);
      continue;
    }

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

    // Se for parcelada, calcula "parcela X de N" pra exibir no lembrete.
    let installment: { current: number; total: number } | undefined;
    if (fe.installmentsTotal && fe.installmentsStartMonth) {
      const start = parseMonthKey(fe.installmentsStartMonth);
      if (start) {
        const current = monthsInclusive(start, {
          year: due.year,
          month: due.month,
        });
        if (current >= 1 && current <= fe.installmentsTotal) {
          installment = { current, total: fe.installmentsTotal };
        }
      }
    }

    const message = formatFixedExpenseReminder({
      name: fe.name,
      amount: fe.amount.toNumber(),
      dueDay: fe.dueDay,
      daysUntil,
      category: fe.category,
      installment,
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

type FixedExpenseWithUser = Awaited<
  ReturnType<typeof prisma.fixedExpense.findMany>
>[number] & { user: { id: string; telegramId: bigint } };

async function completeFixedExpense(
  bot: Bot,
  fe: FixedExpenseWithUser,
  lastDue: DayInTZ,
): Promise<void> {
  // Idempotência: a query principal filtra `completedAt: null`, mas pra
  // garantir contra corridas usamos updateMany com `completedAt: null` no
  // where. Se zero linhas afetadas, outro tick já mandou.
  const res = await prisma.fixedExpense.updateMany({
    where: { id: fe.id, completedAt: null },
    data: { completedAt: new Date(), active: false },
  });
  if (res.count === 0) return;

  const message = formatFixedExpenseCompleted({
    name: fe.name,
    amount: fe.amount.toNumber(),
    installmentsTotal: fe.installmentsTotal ?? 0,
    lastDueLabel: `${String(lastDue.day).padStart(2, "0")}/${String(lastDue.month).padStart(2, "0")}/${lastDue.year}`,
  });

  try {
    await bot.api.sendMessage(Number(fe.user.telegramId), message);
  } catch (err) {
    console.error(
      `[fixed-notifier] failed to send completion message fe=${fe.id} (${describeError(err)})`,
    );
  }

  broadcast(fe.user.id, {
    type: "fixed_expense.completed",
    payload: { id: fe.id, completedAt: new Date().toISOString() },
  });

  console.log(`[fixed-notifier] completed fe=${fe.id}`);
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
