"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { copy } from "@/lib/copy";
import { PumpkinIcon } from "./icons";

interface Props {
  peak: number;
  attemptsLeft: number | null;
  busy: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export default function LoseScreen({ peak, attemptsLeft, busy, onRetry, onHome }: Props) {
  const pct = Math.floor(peak * 100);
  const out = attemptsLeft === 0;
  const taunt = copy.lose.taunt[pct % copy.lose.taunt.length];

  return (
    <div className="game__safe justify-between">
      <motion.p
        className="game__title mt-6 text-center text-[clamp(2rem,9vw,3rem)] text-(--g-danger) drop-shadow-[0_0_24px_rgb(255_59_92/0.6)]"
        initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
      >
        {taunt}
      </motion.p>

      <motion.section
        className="game__panel mx-auto w-full max-w-md p-5 text-center"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-2xl">{copy.lose.title}</h2>
        <p className="mt-1 text-(--g-muted)">{copy.lose.freed(pct)}</p>
        <div className="mx-auto mt-3 h-2 max-w-60 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-(--g-pumpkin)" style={{ width: `${pct}%` }} />
        </div>

        <button type="button" className="game__button mt-5 w-full" onClick={onRetry} disabled={busy || out}>
          <RotateCcw size={18} /> {copy.lose.tryAgain}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-(--g-muted)">
          <PumpkinIcon size={16} />
          {attemptsLeft === null ? " " : out ? copy.noTriesLeft : copy.triesLeft(attemptsLeft)}
        </p>
        <button type="button" className="mt-3 text-sm text-(--g-muted) underline underline-offset-4" onClick={onHome}>
          {copy.win.playAgain}
        </button>
      </motion.section>
    </div>
  );
}
