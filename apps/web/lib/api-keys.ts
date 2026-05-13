import "server-only";

import { prisma } from "@cofri/db";
import { decrypt, encrypt, loadMasterKey } from "@cofri/crypto";
import { serverEnv } from "./env";
import type { ApiKeyStatus, Provider } from "./api-keys-shared";

// Re-exporta tipos/constantes pra módulos server que ainda esperam tudo daqui.
export {
  PROVIDERS,
  apiKeyCreateSchema,
  type Provider,
  type ApiKeyStatus,
} from "./api-keys-shared";

function previewOf(key: string): string {
  const last = key.slice(-4);
  return `${key.slice(0, 3)}…${last}`;
}

function detectProvider(key: string): Provider | null {
  const k = key.trim();
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("sk-") || k.startsWith("org-")) return "openai";
  return null;
}

export async function listApiKeyStatuses(
  userId: string,
): Promise<ApiKeyStatus[]> {
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const master = loadMasterKey(serverEnv.encryptionMasterKey);

  return rows.map((r) => {
    let preview = "—";
    try {
      const plaintext = decrypt(
        {
          ciphertext: Buffer.from(r.ciphertext),
          iv: Buffer.from(r.iv),
          authTag: Buffer.from(r.authTag),
        },
        master,
      );
      preview = previewOf(plaintext);
    } catch {}
    return {
      provider: r.provider as Provider,
      createdAt: r.createdAt.toISOString(),
      preview,
    };
  });
}

export async function saveApiKey(
  userId: string,
  provider: Provider,
  rawKey: string,
): Promise<void> {
  const inferred = detectProvider(rawKey);
  if (inferred && inferred !== provider) {
    throw new Error(
      `A chave começa com formato de ${inferred}, mas você selecionou ${provider}.`,
    );
  }

  const master = loadMasterKey(serverEnv.encryptionMasterKey);
  const sealed = encrypt(rawKey.trim(), master);

  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
    },
    update: {
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
    },
  });
}

export async function deleteApiKey(
  userId: string,
  provider: Provider,
): Promise<void> {
  await prisma.apiKey.deleteMany({ where: { userId, provider } });
}
