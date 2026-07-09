import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing server encryption secret.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(payload: string) {
  const [ivValue, authTagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
