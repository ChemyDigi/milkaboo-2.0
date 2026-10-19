import { gameConfig, minRoundSeconds } from "@/lib/gameConfig";
import type { ProgressSample } from "@/lib/gameEngine";

const { round, server } = gameConfig;

export interface RoundRecord {
  durationMs: number;
  samples: ProgressSample[];
}

export type RoundCheck = { ok: true } | { ok: false; reason: string };

/**
 * Replays a round's progress samples against the game's physics. A browser can't be trusted to say "I won",
 * but it can't fake a believable record without also playing within these limits.
 * Shared with the client so a legitimate round is never rejected for drifting from the server's rules.
 */
export function validateRound(record: unknown): RoundCheck {
  if (!record || typeof record !== "object") return { ok: false, reason: "no record" };
  const { durationMs, samples } = record as Partial<RoundRecord>;
  if (typeof durationMs !== "number" || !Array.isArray(samples)) return { ok: false, reason: "malformed record" };

  const seconds = durationMs / 1000;
  // a 5% margin under the physical minimum absorbs frame timing
  if (seconds < minRoundSeconds * 0.95) return { ok: false, reason: "too fast" };
  if (seconds > round.timeLimit + server.durationSlackSec) return { ok: false, reason: "too slow" };

  const expected = durationMs / server.sampleIntervalMs;
  if (samples.length < expected * 0.6 || samples.length > expected * 1.5 + 4) {
    return { ok: false, reason: "sample count" };
  }

  const maxRate = (round.maxBoost / round.fillSeconds) * server.rateTolerance;
  let prevT = -1;
  let prevP = 0;
  for (const s of samples) {
    if (!Array.isArray(s) || s.length !== 2) return { ok: false, reason: "malformed sample" };
    const [t, p] = s;
    if (typeof t !== "number" || typeof p !== "number" || !Number.isFinite(t) || !Number.isFinite(p)) {
      return { ok: false, reason: "malformed sample" };
    }
    if (p < 0 || p > 1 || t < prevT || t > durationMs + 50) return { ok: false, reason: "out of range" };
    if (prevT >= 0) {
      const dt = Math.max(1, t - prevT) / 1000;
      // + 0.01 covers rounding of the stored progress
      if (p - prevP > maxRate * dt + 0.01) return { ok: false, reason: "impossible rate" };
    }
    prevT = t;
    prevP = p;
  }
  if (samples.length === 0 || samples[0][1] > 0.01) return { ok: false, reason: "bad start" };
  if (prevP < 0.999) return { ok: false, reason: "not freed" };
  return { ok: true };
}
