import { gameConfig } from "@/lib/gameConfig";

const { round, fightBack, server } = gameConfig;

/** [ms since round start, progress 0–1] */
export type ProgressSample = [number, number];

export type RoundStatus = "running" | "won" | "lost";

export interface RoundState {
  status: RoundStatus;
  /** seconds since the round started */
  elapsed: number;
  /** 0–1: how much of the cup is free */
  progress: number;
  /** highest progress reached (shown on the lose screen) */
  peak: number;
  /** the player is currently pulling hard enough */
  sucking: boolean;
  /** 1–maxBoost while sucking */
  boost: number;
  /** the ghost is fighting back right now */
  gripping: boolean;
  gripUntil: number;
  nextGripAt: number;
  samples: ProgressSample[];
  nextSampleAt: number;
}

export interface BreathInput {
  rms: number;
  threshold: number;
  /** breath-like and above the base threshold (debounced by the detector) */
  isSucking: boolean;
}

export type RoundEvent = "gripStart" | "gripEnd" | "won" | "lost";

const randomBetween = (min: number, max: number, rng: () => number) => min + (max - min) * rng();

export function createRound(rng: () => number = Math.random): RoundState {
  return {
    status: "running",
    elapsed: 0,
    progress: 0,
    peak: 0,
    sucking: false,
    boost: 1,
    gripping: false,
    gripUntil: 0,
    nextGripAt: randomBetween(fightBack.minInterval, fightBack.maxInterval, rng),
    samples: [[0, 0]],
    nextSampleAt: server.sampleIntervalMs / 1000,
  };
}

/** Advance the round by `dt` seconds. Mutates and returns `state`; pushes anything notable into `events`. */
export function stepRound(
  state: RoundState,
  input: BreathInput,
  dt: number,
  events: RoundEvent[],
  rng: () => number = Math.random,
): RoundState {
  if (state.status !== "running") return state;
  state.elapsed += dt;

  // the ghost fights back on a random schedule
  if (!state.gripping && state.elapsed >= state.nextGripAt) {
    state.gripping = true;
    state.gripUntil = state.elapsed + fightBack.duration;
    events.push("gripStart");
  } else if (state.gripping && state.elapsed >= state.gripUntil) {
    state.gripping = false;
    state.nextGripAt = state.elapsed + randomBetween(fightBack.minInterval, fightBack.maxInterval, rng);
    events.push("gripEnd");
  }

  const thresholdMult = state.gripping ? fightBack.thresholdMultiplier : 1;
  const drainMult = state.gripping ? fightBack.drainMultiplier : 1;
  const threshold = input.threshold * thresholdMult;
  state.sucking = input.isSucking && input.rms >= threshold;

  if (state.sucking) {
    state.boost = Math.min(round.maxBoost, Math.max(1, 1 + (input.rms / threshold - 1) * round.boostSlope));
    state.progress += (dt / round.fillSeconds) * state.boost;
  } else {
    state.boost = 1;
    state.progress -= round.drainPerSec * drainMult * dt;
  }
  state.progress = Math.min(1, Math.max(0, state.progress));
  state.peak = Math.max(state.peak, state.progress);

  // light record for the server to replay
  if (state.elapsed >= state.nextSampleAt || state.progress >= 1) {
    state.samples.push([Math.round(state.elapsed * 1000), Math.round(state.progress * 1000) / 1000]);
    state.nextSampleAt += server.sampleIntervalMs / 1000;
  }

  if (state.progress >= 1) {
    state.status = "won";
    events.push("won");
  } else if (state.elapsed >= round.timeLimit) {
    state.status = "lost";
    events.push("lost");
  }
  return state;
}
