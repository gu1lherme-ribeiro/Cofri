import { prisma } from "@cofri/db";

export async function upsertUserByTelegramId(telegramId: number) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    create: { telegramId: BigInt(telegramId) },
    update: {},
  });
}
