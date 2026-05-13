import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export type Sealed = {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
};

export function loadMasterKey(base64: string): Buffer {
  if (!base64 || base64.trim() === "") {
    throw new Error("ENCRYPTION_MASTER_KEY is empty");
  }
  const key = Buffer.from(base64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must decode to ${KEY_BYTES} bytes, got ${key.length}`,
    );
  }
  return key;
}

export function encrypt(plaintext: string, masterKey: Buffer): Sealed {
  if (masterKey.length !== KEY_BYTES) {
    throw new Error(`masterKey must be ${KEY_BYTES} bytes`);
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

export function decrypt(sealed: Sealed, masterKey: Buffer): string {
  if (masterKey.length !== KEY_BYTES) {
    throw new Error(`masterKey must be ${KEY_BYTES} bytes`);
  }
  if (sealed.iv.length !== IV_BYTES) {
    throw new Error(`iv must be ${IV_BYTES} bytes`);
  }
  if (sealed.authTag.length !== AUTH_TAG_BYTES) {
    throw new Error(`authTag must be ${AUTH_TAG_BYTES} bytes`);
  }
  const decipher = createDecipheriv(ALGORITHM, masterKey, sealed.iv);
  decipher.setAuthTag(sealed.authTag);
  const plaintext = Buffer.concat([
    decipher.update(sealed.ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
