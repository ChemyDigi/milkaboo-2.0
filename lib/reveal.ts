import { gameConfig } from "@/lib/gameConfig";

const { stages } = gameConfig;

/** Ghost/cup extents in the cup's local space: everything the sheet covers sits between these heights. */
export const GHOST_TOP = 2.75;
export const GHOST_BOTTOM = -1.45;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => t * t * (3 - 2 * t);

export interface RevealShape {
  /** surface above this height is free of the ghost */
  revealY: number;
  /** size of the patch still clinging over the logo, in logo half-sizes (1 = exactly the logo, ≤0 = gone) */
  patch: number;
  /** 0–1: how far the ghost has stretched toward the player before anything comes free */
  stretch: number;
  /** 0–1: how much of each arm is still wrapped around the cup (the hands stay on the logo) */
  arm: number;
}

/**
 * Maps progress (0–1) onto the shape of the ghost's grip. The three stages from the brief:
 *  0–30%   the ghost only stretches toward the player
 *  30–70%  it peels from the top: straw, lid, then the body; the logo stays covered
 *  70–99%  only the logo is covered and the ghost clings on with its hands
 */
export function revealShape(progress: number): RevealShape {
  const p = clamp01(progress);
  const peel = clamp01((p - stages.stretchEnd) / (stages.logoOnly - stages.stretchEnd));
  const cling = clamp01((p - stages.logoOnly) / (1 - stages.logoOnly));
  return {
    revealY: lerp(GHOST_TOP + 0.15, GHOST_BOTTOM - 0.25, easeInOut(peel)),
    patch: lerp(1.35, 0.8, cling),
    stretch: clamp01(p / stages.stretchEnd),
    arm: lerp(1, 0.32, peel) - cling * 0.14,
  };
}
