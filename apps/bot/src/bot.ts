import { Bot } from "grammy";
import { env } from "./env.js";
import { handleTextMessage } from "./handler.js";
import { formatDashboardLink, generateDashboardLink } from "./dashboard.js";

export function createBot(): Bot {
  const bot = new Bot(env.telegramBotToken);

  bot.command("start", (ctx) =>
    ctx.reply(
      "Oi! Eu sou o Cofri 🐾\n\n" +
        "Manda um gasto, receita, lembrete ou conta fixa em linguagem natural — eu interpreto, organizo e confirmo. Por exemplo:\n\n" +
        "💸 \"gastei 45 no almoço\"\n" +
        "💰 \"recebi 2000 de freela ontem\"\n" +
        "⏰ \"lembrar de ligar pro Carlos sexta 14h\"\n" +
        "🔖 \"Faculdade 800 todo dia 10\"\n\n" +
        "Pra contas fixas eu envio lembretes automáticos 1 e 2 dias antes do vencimento.\n\n" +
        "Quando quiser ver tudo organizado, manda /dashboard — eu envio um link mágico que expira em 10 minutos.",
    ),
  );

  bot.command("dashboard", async (ctx) => {
    try {
      const link = await generateDashboardLink(ctx.from!.id);
      await ctx.reply(formatDashboardLink(link), {
        link_preview_options: { is_disabled: true },
      });
    } catch (err) {
      console.error("[bot] /dashboard error:", err);
      await ctx.reply(
        "😕 Não consegui gerar o link de acesso agora.\n\n" +
          "Pode ser instabilidade momentânea — tenta /dashboard de novo em alguns segundos.",
      );
    }
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text === "") return;

    // Mostra "digitando..." enquanto o LLM responde.
    await ctx.replyWithChatAction("typing").catch(() => {});

    const reply = await handleTextMessage(text, ctx.from.id);
    await ctx.reply(reply);
  });

  bot.catch((err) => {
    console.error("[bot] error in update", err.ctx.update.update_id, err.error);
  });

  return bot;
}
