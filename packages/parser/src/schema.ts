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
  intent: z.enum([
    "expense",
    "income",
    "reminder",
    "query",
    "fixed_expense",
    "unknown",
  ]),
  amount: z.number().nullable(),
  category: z.string().nullable(),
  description: z.string(),
  occurredAt: z.string().nullable(),
  // Preenchido só pra intent "fixed_expense": dia do mês (1-31) em que a conta
  // vence todos os meses. null/ausente nos demais intents.
  fixedDay: z.number().int().min(1).max(31).nullable().optional(),
  // Parcelamento opcional pra "fixed_expense". Quando informado, marca a conta
  // como finita; ao passar do último vencimento o bot envia parabéns e
  // arquiva a conta. Limite alto (480 = 40 anos) pra cobrir financiamento
  // imobiliário (típico até 360 meses) com margem.
  installmentsTotal: z
    .number()
    .int()
    .min(2)
    .max(480)
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1),
});

export type ParsedMessage = z.infer<typeof ParsedMessageSchema>;

// Threshold abaixo do qual o bot pede reformulação em vez de persistir.
// Calibrado em 0.45 — alto o bastante pra capturar "asdf"/"bom dia" (que vêm
// com confidence ≤ 0.3), baixo o bastante pra aceitar parses claros mas com
// confidence média (~0.5) que o modelo às vezes dá em frases curtas.
export const LOW_CONFIDENCE_THRESHOLD = 0.45;
