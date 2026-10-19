import { gameConfig, minRoundSeconds } from "@/lib/gameConfig";
import { validateRound, type RoundRecord } from "@/lib/validateRound";
import { verifyToken } from "@/lib/server/session";
import { getStore } from "@/lib/server/store";
import {
  campaignDay,
  cleanEmail,
  cleanFingerprint,
  ipHash,
  json,
  newPrizeCode,
  readJson,
} from "@/lib/server/request";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * POST { token, email, fingerprint, record } → { code, expiresAt }
 * The server, not the browser, decides whether a round was a win:
 *  1. the token is genuine, unexpired, from this device, and never claimed before
 *  2. the round took a realistic time, by the server's own clock and by the record
 *  3. the progress record obeys the game's physics (see lib/validateRound.ts)
 *  4. per-email and per-device prize limits, then the token is burned and the daily prize budget checked
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const session = verifyToken(body?.token);
  const fp = cleanFingerprint(body?.fingerprint);
  const email = cleanEmail(body?.email);

  if (!body || !fp) return json({ error: "bad-request" }, 400);
  if (!email) return json({ error: "bad-email" }, 400);
  if (!session || session.fp !== fp) return json({ error: "invalid-session" }, 401);

  const store = getStore();
  const record = body.record as RoundRecord | undefined;
  const serverElapsedMs = Date.now() - session.iat;
  const minServerMs = gameConfig.round.countdownMs + minRoundSeconds * 0.95 * 1000;
  if (serverElapsedMs < minServerMs || (record && record.durationMs > serverElapsedMs)) {
    return json({ error: "round-rejected" }, 422);
  }
  const check = validateRound(record);
  if (!check.ok) {
    console.warn(`[game] rejected claim: ${check.reason}`);
    return json({ error: "round-rejected" }, 422);
  }

  const { prizesPerEmail, prizesPerDevicePerDay, dailyPrizeBudget } = gameConfig.limits;
  const day = campaignDay();
  if ((await store.countPrizesForEmail(email)) >= prizesPerEmail) {
    return json({ error: "email-already-won" }, 409);
  }
  if ((await store.get(`prize-fp:${fp}`, day)) >= prizesPerDevicePerDay) {
    return json({ error: "device-already-won" }, 409);
  }
  // burned only once every check has passed, so a player told "email already used" can retry with another
  if (!(await store.useNonce(session.n))) return json({ error: "already-claimed" }, 409);
  if (!(await store.takePrize(day, dailyPrizeBudget))) {
    return json({ error: "budget-spent" }, 410);
  }

  let code = newPrizeCode();
  while (await store.findPrize(code)) code = newPrizeCode();

  const issuedAt = Date.now();
  const expiresAt = issuedAt + gameConfig.server.codeValidDays * DAY_MS;
  await store.savePrize({
    code,
    email,
    fingerprint: fp,
    ipHash: ipHash(request),
    issuedAt,
    expiresAt,
    redeemedAt: null,
  });
  await store.increment(`prize-fp:${fp}`, day);

  return json({ code, expiresAt });
}
