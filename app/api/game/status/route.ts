import { gameConfig } from "@/lib/gameConfig";
import { getStore } from "@/lib/server/store";
import { campaignDay, cleanFingerprint, json, readJson, unlimitedAttempts } from "@/lib/server/request";

/** POST { fingerprint } → tries left today for this device, and whether there are prizes left. */
export async function POST(request: Request) {
  const body = await readJson(request);
  const fp = cleanFingerprint(body?.fingerprint);
  if (!fp) return json({ error: "bad-request" }, 400);

  const store = getStore();
  const day = campaignDay();
  const used = await store.get(`fp:${fp}`, day);
  const prizesUsed = await store.get("prizes", day);
  const { maxAttemptsPerDay, dailyPrizeBudget } = gameConfig.limits;

  return json({
    attemptsLeft: unlimitedAttempts() ? maxAttemptsPerDay : Math.max(0, maxAttemptsPerDay - used),
    prizesLeftToday: Math.max(0, dailyPrizeBudget - prizesUsed),
  });
}
