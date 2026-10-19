"use client";

import { gameConfig } from "@/lib/gameConfig";
import type { BreathDetector } from "@/hooks/useBreathDetector";
import type { HudSnapshot } from "@/hooks/useGameLoop";
import type { DeviceTier } from "@/hooks/useDeviceTier";

/** `?debug`: live detector values for tuning on real phones. Hold Space to simulate sucking. */
export default function DebugPanel({ mic, hud, tier }: { mic: BreathDetector; hud: HudSnapshot; tier: DeviceTier }) {
  const flatOk = mic.flatness >= gameConfig.mic.minFlatness;
  const loudOk = mic.rms >= mic.threshold;
  const row = (label: string, value: string, ok?: boolean) => (
    <div className="flex justify-between gap-4">
      <span className="opacity-60">{label}</span>
      <span className={ok === undefined ? "" : ok ? "text-(--g-good)" : "text-(--g-danger)"}>{value}</span>
    </div>
  );
  return (
    <div className="pointer-events-none absolute bottom-[max(6rem,env(safe-area-inset-bottom))] left-2 z-40 w-52 rounded-xl bg-black/75 p-2 font-mono text-[11px] leading-tight text-white">
      {row("mic", mic.status)}
      {row("rms", mic.rms.toFixed(4), loudOk)}
      {row("threshold", mic.threshold.toFixed(4))}
      {row("flatness", mic.flatness.toFixed(3), flatOk)}
      {row("minFlatness", gameConfig.mic.minFlatness.toFixed(2))}
      {row("isSucking", String(mic.isSucking), mic.isSucking)}
      {row("simulated", String(mic.simulated))}
      {row("progress", hud.progress.toFixed(3))}
      {row("gripping", String(hud.gripping))}
      {row("tier", tier)}
      <div className="mt-1 opacity-60">hold Space = suck</div>
    </div>
  );
}
