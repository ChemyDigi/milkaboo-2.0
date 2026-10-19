"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gameConfig } from "@/lib/gameConfig";
import { createRound, stepRound, type RoundEvent, type RoundState } from "@/lib/gameEngine";
import type { BreathReading } from "@/hooks/useBreathDetector";
import type { SceneState } from "@/components/three/sceneState";

export interface HudSnapshot {
  progress: number;
  timeLeft: number;
  sucking: boolean;
  gripping: boolean;
  /** 0–1 mic level relative to what's needed right now (1 = exactly the threshold) */
  level: number;
}

const HUD_INTERVAL_MS = 100;
const idleHud: HudSnapshot = {
  progress: 0,
  timeLeft: gameConfig.round.timeLimit,
  sucking: false,
  gripping: false,
  level: 0,
};

/**
 * Runs a round: each animation frame it feeds the mic reading into the engine, mirrors the result into the
 * 3D scene's state (no React render), and publishes a HUD snapshot ~10×/s. Engine events go to `onEvent`.
 */
export function useGameLoop(
  reading: RefObject<BreathReading>,
  scene: RefObject<SceneState>,
  onEvent: (event: RoundEvent, round: RoundState) => void,
) {
  const [hud, setHud] = useState<HudSnapshot>(idleHud);
  const round = useRef<RoundState | null>(null);
  const raf = useRef(0);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const stop = useCallback(() => cancelAnimationFrame(raf.current), []);

  const start = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const state = createRound();
    round.current = state;
    setHud(idleHud);
    let last = performance.now();
    let lastHud = 0;
    const events: RoundEvent[] = [];

    const tick = (now: number) => {
      // capped so a backgrounded tab can't jump the round forward in one step
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      const r = reading.current;
      stepRound(state, r, dt, events);

      const s = scene.current;
      const needed = r.threshold * (state.gripping ? gameConfig.fightBack.thresholdMultiplier : 1);
      s.progress = state.progress;
      s.suck = state.sucking ? Math.min(1, 0.5 + (r.rms / needed - 1) * 0.5) : 0;
      s.grip = state.gripping;

      if (now - lastHud >= HUD_INTERVAL_MS || events.length) {
        lastHud = now;
        setHud({
          progress: state.progress,
          timeLeft: Math.max(0, gameConfig.round.timeLimit - state.elapsed),
          sucking: state.sucking,
          gripping: state.gripping,
          level: Math.min(1.5, r.rms / Math.max(needed, 1e-6)) / 1.5,
        });
      }
      while (events.length) onEventRef.current(events.shift()!, state);
      if (state.status === "running") raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [reading, scene]);

  useEffect(() => stop, [stop]);

  return { hud, round, start, stop };
}
