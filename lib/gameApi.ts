import type { RoundRecord } from "@/lib/validateRound";

/** A light device fingerprint (hash of stable browser traits). A backup limit only, never an identity. */
export async function deviceFingerprint(): Promise<string> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const traits = [
    nav.userAgent,
    nav.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}@${devicePixelRatio}`,
    nav.hardwareConcurrency,
    nav.deviceMemory ?? "",
    nav.maxTouchPoints,
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(traits));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function post<T>(url: string, body: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json()) as T & { error?: string };
    return res.ok ? { ok: true, data } : { ok: false, error: data.error ?? "network" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export const gameApi = {
  status: (fingerprint: string) =>
    post<{ attemptsLeft: number; prizesLeftToday: number }>("/api/game/status", { fingerprint }),
  start: (fingerprint: string) => post<{ token: string; attemptsLeft: number }>("/api/game/start", { fingerprint }),
  claim: (body: { token: string; email: string; fingerprint: string; record: RoundRecord }) =>
    post<{ code: string; expiresAt: number }>("/api/game/claim", body),
};
