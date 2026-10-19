import type { RefObject } from "react";

export type SceneMode = "intro" | "calibrating" | "playing" | "exiting" | "won" | "lost";

/**
 * What the game tells the 3D scene. A plain mutable object behind a ref: the game loop writes it every frame
 * and the scene reads it in useFrame, so 60 updates a second never re-render React.
 */
export interface SceneState {
  mode: SceneMode;
  /** performance.now() when `mode` last changed */
  modeSince: number;
  /** 0–1 game progress (the ghost's grip follows it, smoothed) */
  progress: number;
  /** 0–1 how hard the player is pulling right now */
  suck: number;
  /** the ghost is fighting back */
  grip: boolean;
}

export type SceneStateRef = RefObject<SceneState>;

export function createSceneState(): SceneState {
  return { mode: "intro", modeSince: 0, progress: 0, suck: 0, grip: false };
}

export function setSceneMode(state: SceneState, mode: SceneMode) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.modeSince = performance.now();
}

/** Smoothed, derived values the Director computes once per frame for every scene component. */
export interface Visual {
  time: number;
  /** progress as drawn: eases toward the game value (snaps back fast when the player stops) */
  progress: number;
  suck: number;
  grip: number;
  /** 0→1 the ghost being sucked into the camera */
  exit: number;
  /** seconds since the win (−1 before) */
  winT: number;
  /** seconds since the loss (−1 before) */
  loseT: number;
  /** 0→1 the warm reveal glow */
  warm: number;
}

export function createVisual(): Visual {
  return { time: 0, progress: 0, suck: 0, grip: 0, exit: 0, winT: -1, loseT: -1, warm: 0 };
}

/** how long the ghost takes to be sucked off at the win (seconds) */
export const EXIT_SECONDS = 0.9;
