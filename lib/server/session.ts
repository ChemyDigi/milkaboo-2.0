import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { gameConfig } from "@/lib/gameConfig";

export interface SessionPayload {
  /** one-time nonce: a token can be claimed once */
  n: string;
  /** issued at, ms since epoch (server clock) */
  iat: number;
  /** device fingerprint the round was started from */
  fp: string;
}

let warned = false;

function secret(): string {
  const value = process.env.GAME_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("GAME_SECRET must be set to at least 32 characters in production.");
  }
  if (!warned) {
    warned = true;
    console.warn("[game] GAME_SECRET is not set; using an insecure development secret.");
  }
  return "dev-only-insecure-secret-change-me-please-0000";
}

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function issueToken(fp: string): { token: string; payload: SessionPayload } {
  const payload: SessionPayload = { n: randomBytes(16).toString("base64url"), iat: Date.now(), fp };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body)}`, payload };
}

/** Returns the payload if the signature is valid and the token hasn't expired; null otherwise. */
export function verifyToken(token: unknown): SessionPayload | null {
  if (typeof token !== "string" || token.length > 512) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.n !== "string" || typeof payload.iat !== "number" || typeof payload.fp !== "string") {
      return null;
    }
    if (Date.now() - payload.iat > gameConfig.server.tokenTtlSec * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
