import { describe, expect, it } from "vitest";
import { ParsedMessageSchema } from "../src/schema.js";

describe("ParsedMessageSchema", () => {
  it("accepts a well-formed expense", () => {
    const result = ParsedMessageSchema.parse({
      intent: "expense",
      amount: 45,
      category: "alimentação",
      description: "Almoço",
      occurredAt: null,
      confidence: 0.95,
    });
    expect(result.intent).toBe("expense");
    expect(result.amount).toBe(45);
  });

  it("accepts amount: null (no value mentioned)", () => {
    const result = ParsedMessageSchema.parse({
      intent: "expense",
      amount: null,
      category: "mercado",
      description: "Queijo",
      occurredAt: null,
      confidence: 0.4,
    });
    expect(result.amount).toBeNull();
  });

  it("accepts a reminder with category null", () => {
    const result = ParsedMessageSchema.parse({
      intent: "reminder",
      amount: null,
      category: null,
      description: "Ligar pro Carlos",
      occurredAt: "2026-05-16T14:00:00-03:00",
      confidence: 0.9,
    });
    expect(result.intent).toBe("reminder");
    expect(result.category).toBeNull();
  });

  it("accepts a query", () => {
    const result = ParsedMessageSchema.parse({
      intent: "query",
      amount: null,
      category: null,
      description: "Total no mercado",
      occurredAt: null,
      confidence: 0.92,
    });
    expect(result.intent).toBe("query");
  });

  it("accepts unknown intent", () => {
    const result = ParsedMessageSchema.parse({
      intent: "unknown",
      amount: null,
      category: null,
      description: "Saudação",
      occurredAt: null,
      confidence: 0.2,
    });
    expect(result.intent).toBe("unknown");
  });

  it("rejects an invalid intent", () => {
    expect(() =>
      ParsedMessageSchema.parse({
        intent: "withdrawal",
        amount: 10,
        category: null,
        description: "x",
        occurredAt: null,
        confidence: 0.5,
      }),
    ).toThrow();
  });

  it("rejects confidence > 1", () => {
    expect(() =>
      ParsedMessageSchema.parse({
        intent: "expense",
        amount: 1,
        category: "outros",
        description: "x",
        occurredAt: null,
        confidence: 1.5,
      }),
    ).toThrow();
  });

  it("rejects confidence < 0", () => {
    expect(() =>
      ParsedMessageSchema.parse({
        intent: "expense",
        amount: 1,
        category: "outros",
        description: "x",
        occurredAt: null,
        confidence: -0.1,
      }),
    ).toThrow();
  });

  it("rejects amount as string", () => {
    expect(() =>
      ParsedMessageSchema.parse({
        intent: "expense",
        amount: "45",
        category: "alimentação",
        description: "x",
        occurredAt: null,
        confidence: 0.9,
      }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() =>
      ParsedMessageSchema.parse({
        intent: "expense",
        amount: 45,
      }),
    ).toThrow();
  });

  it("accepts decimal amounts (32.5)", () => {
    const result = ParsedMessageSchema.parse({
      intent: "expense",
      amount: 32.5,
      category: "alimentação",
      description: "Almoço",
      occurredAt: null,
      confidence: 0.9,
    });
    expect(result.amount).toBe(32.5);
  });

  it("accepts ISO 8601 occurredAt strings", () => {
    const result = ParsedMessageSchema.parse({
      intent: "reminder",
      amount: null,
      category: null,
      description: "x",
      occurredAt: "2026-12-31T23:59:00-03:00",
      confidence: 0.9,
    });
    expect(result.occurredAt).toBe("2026-12-31T23:59:00-03:00");
  });
});
