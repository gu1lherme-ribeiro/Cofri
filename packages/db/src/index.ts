import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __cofriPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__cofriPrisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__cofriPrisma = prisma;
}

export * from "@prisma/client";
