import { createServer } from "node:http";
import { webhookCallback } from "grammy";
import { createBot } from "./bot.js";
import { env } from "./env.js";

async function main() {
  const bot = createBot();

  if (env.botMode === "webhook") {
    if (!env.webhookUrl) {
      throw new Error("BOT_WEBHOOK_URL is required when BOT_MODE=webhook");
    }

    const handle = webhookCallback(bot, "http", {
      secretToken: env.webhookSecret || undefined,
    });

    const server = createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("ok");
        return;
      }
      try {
        await handle(req, res);
      } catch (err) {
        console.error("[webhook] handler error:", err);
        if (!res.headersSent) res.writeHead(500);
        res.end();
      }
    });

    await bot.api.setWebhook(env.webhookUrl, {
      secret_token: env.webhookSecret || undefined,
      allowed_updates: ["message", "callback_query"],
    });

    server.listen(env.port, () => {
      console.log(`[bot] webhook server on :${env.port} → ${env.webhookUrl}`);
    });
    return;
  }

  // polling (dev)
  await bot.api.deleteWebhook({ drop_pending_updates: false }).catch(() => {});
  console.log("[bot] starting in polling mode");
  await bot.start({
    onStart: (me) => console.log(`[bot] @${me.username} online`),
  });
}

main().catch((err) => {
  console.error("[bot] fatal:", err);
  process.exit(1);
});
