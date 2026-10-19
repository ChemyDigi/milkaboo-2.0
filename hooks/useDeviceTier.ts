"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "low" | "mid" | "high";

/** A first guess from the hardware; the scene steps down further at runtime if frames drop (PerformanceMonitor). */
function guessTier(): DeviceTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const touch = nav.maxTouchPoints > 0;
  if (cores <= 4 || memory <= 3) return "low";
  if (touch) return "mid";
  return "high";
}

const noop = () => () => {};

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(noop, guessTier, () => "mid");
}

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void) {
  const mq = matchMedia(motionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => matchMedia(motionQuery).matches, () => false);
}

/** `?debug` in the URL: live mic values on screen, Space simulates sucking. */
export function useDebugFlag(): boolean {
  return useSyncExternalStore(noop, () => new URLSearchParams(location.search).has("debug"), () => false);
}
