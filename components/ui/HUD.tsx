"use client";

import { motion } from "framer-motion";
import { Mic, Timer } from "lucide-react";
import { gameConfig } from "@/lib/gameConfig";
import { copy } from "@/lib/copy";
import type { HudSnapshot } from "@/hooks/useGameLoop";

const status = copy.hud.status;

function statusLine(hud: HudSnapshot): { text: string; tone: "good" | "danger" | "plain" } {
  if (hud.gripping) return { text: status.gripping, tone: "danger" };
  if (hud.sucking) {
    return { text: hud.progress >= gameConfig.stages.logoOnly ? status.almost : status.sucking, tone: "good" };
  }
  if (hud.progress > 0.04) return { text: status.draining, tone: "danger" };
  return { text: status.idle, tone: "plain" };
}

/** The in-round overlay: freed meter, timer, what to do now, and a mic level so players know they're heard. */
export default function HUD({ hud, reducedMotion }: { hud: HudSnapshot; reducedMotion: boolean }) {
  const pct = Math.floor(hud.progress * 100);
  const line = statusLine(hud);
  const urgent = hud.timeLeft <= 5;
  // the level meter's threshold mark sits where level = 1 / 1.5 (see useGameLoop)
  const thresholdMark = 100 / 1.5;

  return (
    <div className="game__safe justify-between">
      {hud.gripping && <div className="game__danger" />}

      <motion.div
        className="flex items-start gap-3 pr-14"
        animate={hud.gripping && !reducedMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35, repeat: hud.gripping && !reducedMotion ? Infinity : 0 }}
      >
        <div className="game__panel flex-1 px-4 py-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-(--g-muted)">{copy.hud.freed}</span>
            <span className="text-xl font-black tabular-nums">{pct}%</span>
          </div>
          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label={copy.hud.freed}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-100 ${
                hud.gripping ? "bg-(--g-danger)" : "bg-linear-to-r from-(--g-accent) to-(--g-pumpkin)"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div
          className={`game__panel flex min-w-20 flex-col items-center px-3 py-2 ${urgent ? "text-(--g-danger)" : ""}`}
          aria-label={`${Math.ceil(hud.timeLeft)} seconds left`}
        >
          <Timer size={16} className="opacity-70" />
          <span className="text-2xl font-black tabular-nums">{Math.ceil(hud.timeLeft)}</span>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-3 pb-2">
        <p
          aria-live="polite"
          className={`game__title text-center text-[clamp(1.8rem,8vw,2.6rem)] ${
            line.tone === "danger" ? "text-(--g-danger)" : line.tone === "good" ? "text-(--g-good)" : "text-(--g-text)"
          } drop-shadow-[0_2px_16px_rgb(0_0_0/0.8)]`}
        >
          {line.text}
        </p>
        <div className="game__panel flex w-full max-w-xs items-center gap-2 px-3 py-2" aria-hidden="true">
          <Mic size={16} className={hud.sucking ? "text-(--g-good)" : "text-(--g-muted)"} />
          <span className="sr-only">{copy.hud.micLabel}</span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${hud.sucking ? "bg-(--g-good)" : "bg-white/50"}`}
              style={{ width: `${Math.round(hud.level * 100)}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${thresholdMark}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
