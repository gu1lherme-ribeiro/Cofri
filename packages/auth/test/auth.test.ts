import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildMagicLinkUrl,
  issueMagicLink,
  issueSession,
  verifyMagicLink,
  verifySession,
} from "../src/index.js";

const secret = () => randomBytes(32).toString("base64");

describe("magic-link tokens", () => {
  it("roundtrips the userId", async () => {
    const s = secret();
    const token = await issueMagicLink({ userId: "user_abc" }, s);
    const claims = await verifyMagicLink(token, s);
    expect(claims.userId).toBe("user_abc");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueMagicLink({ userId: "user_abc" }, secret());
    await expect(verifyMagicLink(token, secret())).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const s = secret();
    const token = await issueMagicLink({ userId: "user_abc" }, s, {
      ttlSeconds: 1,
    });
    await new Promise((r) => setTimeout(r, 1100));
    await expect(verifyMagicLink(token, s)).rejects.toThrow();
  });

  it("rejects a tampered token", async () => {
    const s = secret();
    const token = await issueMagicLink({ userId: "user_abc" }, s);
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "b" : "a");
    await expect(verifyMagicLink(tampered, s)).rejects.toThrow();
  });

  it("refuses short secrets", async () => {
    await expect(
      issueMagicLink({ userId: "u" }, "too-short"),
    ).rejects.toThrow(/32 characters/);
  });
});

describe("session tokens", () => {
  it("roundtrips the userId", async () => {
    const s = secret();
    const token = await issueSession({ userId: "user_xyz" }, s);
    const claims = await verifySession(token, s);
    expect(claims.userId).toBe("user_xyz");
  });

  it("rejects an expired session", async () => {
    const s = secret();
    const token = await issueSession({ userId: "u" }, s, { ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    await expect(verifySession(token, s)).rejects.toThrow();
  });
});

describe("audience isolation (magic vs session)", () => {
  it("magic-link token cannot be used as a session", async () => {
    const s = secret();
    const magic = await issueMagicLink({ userId: "u" }, s);
    await expect(verifySession(magic, s)).rejects.toThrow();
  });

  it("session token cannot be used as a magic link", async () => {
    const s = secret();
    const session = await issueSession({ userId: "u" }, s);
    await expect(verifyMagicLink(session, s)).rejects.toThrow();
  });
});

describe("buildMagicLinkUrl", () => {
  it("appends ?token to the dashboard URL", () => {
    expect(buildMagicLinkUrl("http://localhost:3000", "abc.def")).toBe(
      "http://localhost:3000/auth?token=abc.def",
    );
  });

  it("strips a trailing slash", () => {
    expect(buildMagicLinkUrl("https://pingo.app/", "abc")).toBe(
      "https://pingo.app/auth?token=abc",
    );
  });

  it("encodes the token", () => {
    const url = buildMagicLinkUrl("https://x", "a+b/c=d");
    expect(url).toBe("https://x/auth?token=a%2Bb%2Fc%3Dd");
  });
});
