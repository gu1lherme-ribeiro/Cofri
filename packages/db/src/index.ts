import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __pingoPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__pingoPrisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pingoPrisma = prisma;
}

export * from "@prisma/client";
