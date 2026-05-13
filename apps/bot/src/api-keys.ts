import { prisma } from "@cofri/db";
import { decrypt, loadMasterKey } from "@cofri/crypto";
import type { ProviderName } from "@cofri/parser";
import { env } from "./env.js";

export type ResolvedApiKey = {
  apiKey: string;
  provider: ProviderName;
  source: "user" | "fallback";
};

const SUPPORTED: readonly ProviderName[] = ["anthropic", "openai"];

function fallbackKey(): ResolvedApiKey | null {
  if (!env.llmApiKey) return null;
  const key = env.llmApiKey;
  const provider: ProviderName = key.startsWith("sk-ant-")
    ? "anthropic"
    : "openai";
  return { apiKey: key, provider, source: "fallback" };
}

export async function resolveUserApiKey(
  userId: string,
): Promise<ResolvedApiKey | null> {
  const row = await prisma.apiKey.findFirst({
    where: { userId, provider: { in: [...SUPPORTED] } },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return fallbackKey();

  try {
    const master = loadMasterKey(env.encryptionMasterKey);
    const apiKey = decrypt(
      {
        ciphertext: Buffer.from(row.ciphertext),
        iv: Buffer.from(row.iv),
        authTag: Buffer.from(row.authTag),
      },
      master,
    );
    return {
      apiKey,
      provider: row.provider as ProviderName,
      source: "user",
    };
  } catch (err) {
    console.error(
      `[api-keys] decrypt failed user=${userId} provider=${row.provider}:`,
      err,
    );
    return fallbackKey();
  }
}
