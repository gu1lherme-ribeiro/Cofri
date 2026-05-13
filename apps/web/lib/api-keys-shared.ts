import { z } from "zod";

/**
 * Pedaços de `api-keys` que NÃO dependem de Node (Prisma, node:crypto).
 * Importáveis tanto de Server quanto de Client Components.
 */

export const PROVIDERS = ["openai", "anthropic"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const apiKeyCreateSchema = z.object({
  provider: z.enum(PROVIDERS),
  key: z.string().min(10).max(500),
});

export type ApiKeyStatus = {
  provider: Provider;
  createdAt: string;
  /** "sk-…XXXX" — só pra confirmação visual; nunca a chave inteira. */
  preview: string;
};
