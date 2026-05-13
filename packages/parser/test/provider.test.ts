import { describe, expect, it } from "vitest";
import { detectProvider } from "../src/provider.js";

describe("detectProvider", () => {
  it("identifies Anthropic keys (sk-ant-…)", () => {
    expect(detectProvider("sk-ant-api03-abc123")).toBe("anthropic");
  });

  it("identifies OpenAI project keys (sk-proj-…)", () => {
    expect(detectProvider("sk-proj-abc123")).toBe("openai");
  });

  it("identifies OpenAI legacy keys (sk-…)", () => {
    expect(detectProvider("sk-abc123def456")).toBe("openai");
  });

  it("identifies OpenAI org-scoped keys (org-…)", () => {
    expect(detectProvider("org-abc123def456")).toBe("openai");
  });

  it("trims whitespace before checking", () => {
    expect(detectProvider("  sk-ant-foo  ")).toBe("anthropic");
  });

  it("throws on an unrecognized key shape", () => {
    expect(() => detectProvider("googl-abc123")).toThrow(/could not detect/);
  });

  it("throws on empty string", () => {
    expect(() => detectProvider("")).toThrow(/could not detect/);
  });
});
