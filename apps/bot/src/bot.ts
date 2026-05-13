import { Bot } from "grammy";
import { env } from "./env.js";
import { handleTextMessage } from "./handler.js";
import { formatDashboardLink, generateDashboardLink } from "./dashboard.js";

export function createBot(): Bot {
  const bot = new Bot(env.telegramBotToken);

  bot.command("start", (ctx) =>
    ctx.reply(
      "Oi! Eu sou o Pingo 🐾\n\n" +
        "Me manda um gasto, receita ou lembrete em linguagem natural — eu interpreto, organizo e confirmo. Por exemplo:\n\n" +
        "• \"gastei 45 no almoço\"\n" +
        "• \"recebi 2000 de freela ontem\"\n" +
        "• \"lembrar de pagar luz dia 15\"\n\n" +
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
      await ctx.reply("Ops, não consegui gerar o link agora. Tenta de novo?");
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
