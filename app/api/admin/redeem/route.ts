import { timingSafeEqual } from "node:crypto";
import { getStore, type PrizeRecord } from "@/lib/server/store";
import { json, normalizePrizeCode } from "@/lib/server/request";

/**
 * Counter staff, with `Authorization: Bearer <ADMIN_REDEEM_TOKEN>`:
 *   GET  /api/admin/redeem?code=BOO-XXXXX  → check a code (no change)
 *   POST /api/admin/redeem?code=BOO-XXXXX  → mark it redeemed
 * Redeeming is a POST so link previews and browser prefetching can never use up a customer's code.
 */
function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_REDEEM_TOKEN;
  if (!expected || expected.length < 16) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function describe(prize: PrizeRecord) {
  const now = Date.now();
  return {
    code: prize.code,
    status: prize.redeemedAt ? "redeemed" : now > prize.expiresAt ? "expired" : "valid",
    issuedAt: new Date(prize.issuedAt).toISOString(),
    expiresAt: new Date(prize.expiresAt).toISOString(),
    redeemedAt: prize.redeemedAt ? new Date(prize.redeemedAt).toISOString() : null,
    // enough for staff to match the person in front of them, not the whole address
    email: prize.email.replace(/^(.).*(@.*)$/, "$1•••$2"),
  };
}

async function handle(request: Request, redeem: boolean) {
  if (!authorized(request)) return json({ error: "unauthorized" }, 401);
  const code = normalizePrizeCode(new URL(request.url).searchParams.get("code"));
  if (!code) return json({ error: "bad-code" }, 400);

  const store = getStore();
  const prize = await store.findPrize(code);
  if (!prize) return json({ error: "not-found" }, 404);
  if (!redeem) return json(describe(prize));

  if (prize.redeemedAt) return json({ ...describe(prize), error: "already-redeemed" }, 409);
  if (Date.now() > prize.expiresAt) return json({ ...describe(prize), error: "expired" }, 410);
  const updated = await store.redeemPrize(code);
  return json(describe(updated ?? prize));
}

export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
