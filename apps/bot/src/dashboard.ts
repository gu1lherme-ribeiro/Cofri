import { buildMagicLinkUrl, issueMagicLink } from "@pingo/auth";
import { env } from "./env.js";
import { upsertUserByTelegramId } from "./users.js";

const TTL_SECONDS = 60 * 10;

export type DashboardLink = {
  url: string;
  expiresInMinutes: number;
};

export async function generateDashboardLink(
  telegramId: number,
): Promise<DashboardLink> {
  const user = await upsertUserByTelegramId(telegramId);
  const token = await issueMagicLink(
    { userId: user.id },
    env.authJwtSecret,
    { ttlSeconds: TTL_SECONDS },
  );
  return {
    url: buildMagicLinkUrl(env.dashboardUrl, token),
    expiresInMinutes: TTL_SECONDS / 60,
  };
}

export function formatDashboardLink(link: DashboardLink): string {
  return (
    `🔗 Abra seu dashboard:\n${link.url}\n\n` +
    `(o link expira em ${link.expiresInMinutes} minutos)`
  );
}
