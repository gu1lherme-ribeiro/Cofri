import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserMessage } from "../src/prompt.js";
import { CATEGORIES } from "../src/schema.js";

describe("SYSTEM_PROMPT", () => {
  it("mentions every allowed category", () => {
    for (const category of CATEGORIES) {
      expect(SYSTEM_PROMPT).toContain(category);
    }
  });

  it("mentions every intent", () => {
    for (const intent of ["expense", "income", "reminder", "query", "unknown"]) {
      expect(SYSTEM_PROMPT).toContain(intent);
    }
  });

  it("instructs the model to return JSON only", () => {
    expect(SYSTEM_PROMPT).toMatch(/APENAS|apenas/);
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("json");
  });

  it("contains the few-shot block (parser must see examples)", () => {
    const exampleCount = (SYSTEM_PROMPT.match(/Mensagem:/g) ?? []).length;
    expect(exampleCount).toBeGreaterThanOrEqual(10);
  });

  it("is dense enough to be a serious prompt", () => {
    // A rough proxy for token count: in PT-BR, ~3.5 chars/token average.
    // We want a substantial prompt to give the model strong grounding —
    // not strictly required for caching to function, but a healthy prompt
    // should be at least ~2500 chars.
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(2500);
  });
});

describe("buildUserMessage", () => {
  it("injects today's date and the user text", () => {
    const result = buildUserMessage("gastei 45 no almoço", "2026-05-13");
    expect(result).toContain("2026-05-13");
    expect(result).toContain("America/Sao_Paulo");
    expect(result).toContain("gastei 45 no almoço");
  });

  it("places the date before the user message", () => {
    const result = buildUserMessage("foo", "2026-01-01");
    const dateIdx = result.indexOf("2026-01-01");
    const userIdx = result.indexOf("foo");
    expect(dateIdx).toBeLessThan(userIdx);
  });

  it("preserves multi-line user input", () => {
    const result = buildUserMessage("linha 1\nlinha 2", "2026-05-13");
    expect(result).toContain("linha 1\nlinha 2");
  });
});
