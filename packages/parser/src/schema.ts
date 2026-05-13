import { z } from "zod";

export const CATEGORIES = [
  "alimentação",
  "transporte",
  "lazer",
  "mercado",
  "saúde",
  "casa",
  "assinatura",
  "trabalho",
  "outros",
] as const;

export const ParsedMessageSchema = z.object({
  intent: z.enum(["expense", "income", "reminder", "query", "unknown"]),
  amount: z.number().nullable(),
  category: z.string().nullable(),
  description: z.string(),
  occurredAt: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type ParsedMessage = z.infer<typeof ParsedMessageSchema>;

// Threshold abaixo do qual o bot pede reformulação em vez de persistir.
// Calibrado em 0.45 — alto o bastante pra capturar "asdf"/"bom dia" (que vêm
// com confidence ≤ 0.3), baixo o bastante pra aceitar parses claros mas com
// confidence média (~0.5) que o modelo às vezes dá em frases curtas.
export const LOW_CONFIDENCE_THRESHOLD = 0.45;
