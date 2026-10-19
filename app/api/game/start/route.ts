import { gameConfig } from "@/lib/gameConfig";
import { issueToken } from "@/lib/server/session";
import { getStore } from "@/lib/server/store";
import { campaignDay, cleanFingerprint, ipHash, json, readJson, unlimitedAttempts } from "@/lib/server/request";

/**
 * POST { fingerprint } → { token, attemptsLeft }
 * Starting a round uses up a try. The token is HMAC-signed with a start time and a one-time nonce;
 * /api/game/claim only accepts a win that carries one.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const fp = cleanFingerprint(body?.fingerprint);
  if (!fp) return json({ error: "bad-request" }, 400);

  const store = getStore();
  const day = campaignDay();
  const ip = ipHash(request);
  const { maxAttemptsPerDay, maxAttemptsPerIpPerDay } = gameConfig.limits;

  let attemptsLeft: number = maxAttemptsPerDay;
  if (!unlimitedAttempts()) {
    const [deviceTries, ipTries] = await Promise.all([store.get(`fp:${fp}`, day), store.get(`ip:${ip}`, day)]);
    if (deviceTries >= maxAttemptsPerDay || ipTries >= maxAttemptsPerIpPerDay) {
      return json({ error: "no-attempts-left", attemptsLeft: 0 }, 429);
    }
    const used = await store.increment(`fp:${fp}`, day);
    await store.increment(`ip:${ip}`, day);
    attemptsLeft = Math.max(0, maxAttemptsPerDay - used);
  }

  const { token } = issueToken(fp);
  return json({ token, attemptsLeft });
}
