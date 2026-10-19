"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { gameConfig } from "@/lib/gameConfig";
import { copy } from "@/lib/copy";
import { deviceFingerprint, gameApi } from "@/lib/gameApi";
import type { RoundEvent, RoundState } from "@/lib/gameEngine";
import type { RoundRecord } from "@/lib/validateRound";
import { useBreathDetector } from "@/hooks/useBreathDetector";
import { useDebugFlag, useDeviceTier, useReducedMotion } from "@/hooks/useDeviceTier";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useSounds } from "@/hooks/useSounds";
import { EXIT_SECONDS, createSceneState, setSceneMode, type SceneMode } from "@/components/three/sceneState";
import CalibratingScreen from "./CalibratingScreen";
import DebugPanel from "./DebugPanel";
import HUD from "./HUD";
import IntroScreen from "./IntroScreen";
import LoseScreen from "./LoseScreen";
import MuteButton from "./MuteButton";
import PermissionScreen from "./PermissionScreen";
import WinScreen, { isFinalClaimError, type ClaimState } from "./WinScreen";

// WebGL only exists in the browser
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

type Screen = "intro" | "permission" | "calibrating" | "playing" | "won" | "lost";

/**
 * "Free the Milkaboo Cup": the screen flow and the glue between mic, game loop, 3D scene, sounds and server.
 * intro → (permission) → calibrating → playing → won | lost
 */
export default function Game() {
  const debug = useDebugFlag();
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const mic = useBreathDetector();
  const sounds = useSounds();
  const sceneState = useRef(createSceneState());

  const [screen, setScreen] = useState<Screen>("intro");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [peak, setPeak] = useState(0);
  const [claim, setClaim] = useState<ClaimState>({ kind: "form" });

  const fingerprint = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const record = useRef<RoundRecord | null>(null);
  const micGranted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const show = useCallback((next: Screen, mode: SceneMode) => {
    setScreen(next);
    setSceneMode(sceneState.current, mode);
  }, []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const refreshStatus = useCallback(async () => {
    fingerprint.current ??= await deviceFingerprint();
    const res = await gameApi.status(fingerprint.current);
    if (res.ok) setAttemptsLeft(res.data.attemptsLeft);
  }, []);

  useEffect(() => {
    void refreshStatus();
    // skip the explainer if the mic was already allowed (not every browser can tell us)
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((p) => (micGranted.current = p.state === "granted"))
      .catch(() => {});
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [refreshStatus]);

  const endRound = useCallback(() => {
    mic.stop();
    sounds.setSuction(0);
    const s = sceneState.current;
    s.suck = 0;
    s.grip = false;
  }, [mic, sounds]);

  const onRoundEvent = useCallback(
    (event: RoundEvent, round: RoundState) => {
      if (event === "gripStart") {
        sounds.play("wail");
        if ("vibrate" in navigator) navigator.vibrate(gameConfig.fightBack.vibratePattern);
      } else if (event === "won") {
        record.current = { durationMs: Math.round(round.elapsed * 1000), samples: round.samples };
        endRound();
        sounds.play("shloop");
        setClaim({ kind: "form" });
        show("won", "exiting");
        timers.current.push(
          setTimeout(() => {
            setSceneMode(sceneState.current, "won");
            sounds.play("win");
            sounds.setAmbience(0.4);
          }, EXIT_SECONDS * 1000),
        );
      } else if (event === "lost") {
        endRound();
        setPeak(round.peak);
        sceneState.current.progress = 0; // the ghost wraps the whole cup again
        sounds.play("laugh");
        show("lost", "lost");
      }
    },
    [endRound, show, sounds],
  );

  const loop = useGameLoop(mic.readingRef, sceneState, onRoundEvent);

  // the slurp follows the player's suction
  useEffect(() => {
    sounds.setSuction(screen === "playing" && loop.hud.sucking ? 1 : 0);
  }, [screen, loop.hud.sucking, sounds]);

  /** Must run from a tap: it opens the AudioContext and the mic (iOS requires a user gesture). */
  const beginRound = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    sounds.unlock();
    sounds.setAmbience(1);

    let ok = await mic.start();
    if (!ok && debug) {
      mic.startSimulated(); // ?debug on a computer without a mic: Space to suck
      ok = true;
    }
    if (!ok) {
      setScreen("permission");
      setBusy(false);
      return;
    }
    micGranted.current = true;

    fingerprint.current ??= await deviceFingerprint();
    const res = await gameApi.start(fingerprint.current);
    if (!res.ok) {
      mic.stop();
      if (res.error === "no-attempts-left") setAttemptsLeft(0);
      else setNotice(copy.win.errors.network);
      show("intro", "intro");
      setBusy(false);
      return;
    }
    token.current = res.data.token;
    setAttemptsLeft(res.data.attemptsLeft);
    sceneState.current.progress = 0;
    show("calibrating", "calibrating");
    setBusy(false);

    // the room's quiet sets the threshold while the 3-2-1 plays (ambience included, so it can't trigger the mic)
    void mic.calibrate();
    later(() => {
      show("playing", "playing");
      loop.start();
    }, gameConfig.round.countdownMs);
  };

  const onStart = () => {
    if (micGranted.current) void beginRound();
    else {
      sounds.unlock();
      setScreen("permission");
    }
  };

  const goHome = () => {
    loop.stop();
    endRound();
    sounds.setAmbience(1);
    sceneState.current.progress = 0;
    show("intro", "intro");
    void refreshStatus();
  };

  const onClaim = async (email: string) => {
    if (!token.current || !record.current || !fingerprint.current) {
      setClaim({ kind: "failed", error: "invalid-session" });
      return;
    }
    setClaim({ kind: "claiming" });
    const res = await gameApi.claim({
      token: token.current,
      email,
      fingerprint: fingerprint.current,
      record: record.current,
    });
    if (res.ok) setClaim({ kind: "done", ...res.data });
    else setClaim(isFinalClaimError(res.error) ? { kind: "failed", error: res.error } : { kind: "form", error: res.error });
  };

  // ?debug: hold Space to simulate sucking
  useEffect(() => {
    if (!debug) return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      mic.setSimulated(true);
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && mic.setSimulated(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [debug, mic]);

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        <Scene state={sceneState} tier={tier} reducedMotion={reducedMotion} />
      </div>

      <MuteButton muted={sounds.muted} onToggle={sounds.toggleMute} />

      {gameConfig.easy && (
        <p className="pointer-events-none absolute top-[max(0.5rem,env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-(--g-pumpkin) px-3 py-0.5 text-xs font-black text-black">
          EASY TEST MODE
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {screen === "intro" && (
            <IntroScreen attemptsLeft={attemptsLeft} busy={busy} notice={notice} onStart={onStart} />
          )}
          {screen === "permission" && <PermissionScreen status={mic.status} onAllow={() => void beginRound()} />}
          {screen === "calibrating" && <CalibratingScreen />}
          {screen === "playing" && <HUD hud={loop.hud} reducedMotion={reducedMotion} />}
          {screen === "won" && <WinScreen claim={claim} onClaim={onClaim} onDone={goHome} />}
          {screen === "lost" && (
            <LoseScreen
              peak={peak}
              attemptsLeft={attemptsLeft}
              busy={busy}
              onRetry={() => void beginRound()}
              onHome={goHome}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {debug && <DebugPanel mic={mic} hud={loop.hud} tier={tier} />}
    </>
  );
}
