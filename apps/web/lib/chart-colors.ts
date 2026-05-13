/**
 * Paleta por categoria — escolhida pra ser distinguível mas dentro do
 * "Estúdio de contagem" (chroma controlado, lightness uniforme ~62%).
 */
export const CATEGORY_COLORS: Record<string, string> = {
  alimentação: "oklch(62% 0.15 30)", // terra
  transporte: "oklch(62% 0.10 240)", // blue-grey
  lazer: "oklch(68% 0.12 320)", // purple soft
  mercado: "oklch(70% 0.13 90)", // yellow warm
  saúde: "oklch(62% 0.12 175)", // teal
  casa: "oklch(55% 0.08 50)", // brown
  assinatura: "oklch(60% 0.10 270)", // indigo
  trabalho: "oklch(68% 0.10 145)", // sage
  outros: "oklch(55% 0.01 75)", // gray neutro
};

export const CHART_INK = "oklch(0.95 0.005 75)";
export const CHART_INK_FAINT = "oklch(0.45 0.008 75)";
export const CHART_NEGATIVE = "oklch(0.6 0.15 25)";
export const CHART_POSITIVE = "oklch(0.7 0.1 145)";
export const CHART_RULE = "oklch(0.28 0.008 75)";
