import "server-only";
import { createHash, randomInt } from "node:crypto";
import { gameConfig } from "@/lib/gameConfig";

/** Today's date (YYYY-MM-DD) in the campaign's time zone; every daily limit is keyed on it. */
export function campaignDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: gameConfig.limits.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Hashed client IP: enough to rate-limit by, without storing the address itself. */
export function ipHash(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${process.env.GAME_SECRET ?? ""}`).digest("hex").slice(0, 24);
}

/** Fingerprints are hex hashes made in the browser; anything else is treated as missing. */
export function cleanFingerprint(value: unknown): string | null {
  return typeof value === "string" && /^[a-f0-9]{16,64}$/.test(value) ? value : null;
}

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Dev convenience: GAME_UNLIMITED_ATTEMPTS=true skips the per-device/IP try limits outside production. */
export function unlimitedAttempts(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.GAME_UNLIMITED_ATTEMPTS === "true";
}

// no 0/O/1/I/L: easy to read out loud at the counter
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newPrizeCode(): string {
  let body = "";
  for (let i = 0; i < 5; i++) body += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${gameConfig.server.codePrefix}-${body}`;
}

export function normalizePrizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2,5}-[2-9A-Z]{5}$/.test(code) ? code : null;
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
