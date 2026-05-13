import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, loadMasterKey } from "../src/index.js";

const sampleKey = () => randomBytes(32);

describe("loadMasterKey", () => {
  it("decodes a 32-byte base64 key", () => {
    const raw = randomBytes(32);
    const key = loadMasterKey(raw.toString("base64"));
    expect(key.equals(raw)).toBe(true);
  });

  it("rejects an empty key", () => {
    expect(() => loadMasterKey("")).toThrow(/empty/);
  });

  it("rejects a key of the wrong size", () => {
    expect(() => loadMasterKey(randomBytes(16).toString("base64"))).toThrow(
      /32 bytes/,
    );
  });
});

describe("encrypt/decrypt roundtrip", () => {
  it("recovers the original plaintext", () => {
    const key = sampleKey();
    const plaintext = "sk-ant-api03-this-is-a-fake-api-key-9000";
    const sealed = encrypt(plaintext, key);
    expect(decrypt(sealed, key)).toBe(plaintext);
  });

  it("produces a fresh IV each call", () => {
    const key = sampleKey();
    const a = encrypt("same input", key);
    const b = encrypt("same input", key);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it("handles unicode", () => {
    const key = sampleKey();
    const plaintext = "café ☕ — gastei R$45,90";
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext);
  });
});

describe("decrypt tamper detection", () => {
  it("rejects a wrong key", () => {
    const key = sampleKey();
    const wrong = sampleKey();
    const sealed = encrypt("secret", key);
    expect(() => decrypt(sealed, wrong)).toThrow();
  });

  it("rejects a flipped ciphertext byte", () => {
    const key = sampleKey();
    const sealed = encrypt("secret", key);
    sealed.ciphertext[0] = sealed.ciphertext[0]! ^ 0x01;
    expect(() => decrypt(sealed, key)).toThrow();
  });

  it("rejects a flipped auth tag byte", () => {
    const key = sampleKey();
    const sealed = encrypt("secret", key);
    sealed.authTag[0] = sealed.authTag[0]! ^ 0x01;
    expect(() => decrypt(sealed, key)).toThrow();
  });

  it("rejects a flipped IV byte", () => {
    const key = sampleKey();
    const sealed = encrypt("secret", key);
    sealed.iv[0] = sealed.iv[0]! ^ 0x01;
    expect(() => decrypt(sealed, key)).toThrow();
  });
});
