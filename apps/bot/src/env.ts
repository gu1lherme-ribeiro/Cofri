import { config } from "dotenv";
import { resolve } from "node:path";

// Carrega o .env da raiz do monorepo, não do diretório do pacote.
// `pnpm --filter @pingo/bot dev` muda o cwd pra apps/bot/, então
// um `dotenv/config` ingênuo não acharia o arquivo.
config({ path: resolve(import.meta.dirname, "../../../.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  authJwtSecret: required("AUTH_JWT_SECRET"),
  encryptionMasterKey: required("ENCRYPTION_MASTER_KEY"),
  // Em produção, a chave LLM vem da tabela `ApiKey` (BYOK do usuário).
  // Em dev, esse fallback evita exigir BYOK pra testar.
  llmApiKey: optional("LLM_API_KEY"),
  botMode: (optional("BOT_MODE", "polling") as "polling" | "webhook"),
  webhookUrl: optional("BOT_WEBHOOK_URL"),
  webhookSecret: optional("BOT_WEBHOOK_SECRET"),
  port: Number.parseInt(optional("PORT", "8080"), 10),
  dashboardUrl: optional("DASHBOARD_URL", "http://localhost:3000"),
} as const;
