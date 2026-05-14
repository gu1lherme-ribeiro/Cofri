import type { Bot } from "grammy";
import { GrammyError } from "grammy";
import { prisma } from "@cofri/db";
import { formatReminderNotification } from "./format.js";

const TICK_MS = 60_000;
const BATCH_LIMIT = 50;

/**
 * Loop que dispara notificações de lembretes vencidos. Single-instance:
 * roda no mesmo processo do bot, sem fila externa. `notifiedAt` na tabela
 * Reminder serve como cursor — depois de enviado fica preenchido.
 */
export function startReminderNotifier(bot: Bot): () => void {
  let stopped = false;

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      await processDueReminders(bot);
    } catch (err) {
      console.error("[notifier] tick error:", err);
    }
  }

  const id = setInterval(tick, TICK_MS);
  // Roda uma vez no boot pra pegar backlog acumulado durante o redeploy.
  void tick();

  console.log(`[notifier] started · checking every ${TICK_MS / 1000}s`);

  return () => {
    stopped = true;
    clearInterval(id);
  };
}

async function processDueReminders(bot: Bot): Promise<void> {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: { dueAt: { lte: now }, notifiedAt: null },
    include: { user: true },
    orderBy: { dueAt: "asc" },
    take: BATCH_LIMIT,
  });

  if (due.length === 0) return;

  let sent = 0;
  for (const r of due) {
    const message = formatReminderNotification({
      text: r.text,
      dueAt: r.dueAt,
    });
    try {
      await bot.api.sendMessage(Number(r.user.telegramId), message);
      await prisma.reminder.update({
        where: { id: r.id },
        data: { notifiedAt: new Date() },
      });
      sent++;
    } catch (err) {
      if (isPermanentTelegramError(err)) {
        // Usuário bloqueou o bot, chat não existe, etc. Marca como
        // notificado pra não ficar em loop.
        console.error(
          `[notifier] permanent failure reminder=${r.id} ` +
            `(${describeError(err)}); marking as notified`,
        );
        await prisma.reminder
          .update({
            where: { id: r.id },
            data: { notifiedAt: new Date() },
          })
          .catch((dbErr) =>
            console.error(
              `[notifier] also failed to mark notified for reminder=${r.id}:`,
              dbErr,
            ),
          );
      } else {
        console.error(
          `[notifier] transient failure reminder=${r.id} ` +
            `(${describeError(err)}); will retry`,
        );
      }
    }
  }

  if (sent > 0) {
    console.log(
      `[notifier] dispatched ${sent}/${due.length} reminder(s) at ${now.toISOString()}`,
    );
  }
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
