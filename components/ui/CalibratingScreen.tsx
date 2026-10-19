"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gameConfig } from "@/lib/gameConfig";
import { copy } from "@/lib/copy";

const steps = ["3", "2", "1"];

/** "Shhh… the ghost is listening" with a 3-2-1. The mic calibrates on the room's quiet meanwhile. */
export default function CalibratingScreen() {
  const [index, setIndex] = useState(0);
  const stepMs = gameConfig.round.countdownMs / steps.length;

  useEffect(() => {
    const timers = steps.map((_, i) => setTimeout(() => setIndex(i + 1), stepMs * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [stepMs]);

  const label = steps[index] ?? copy.calibrating.go;

  return (
    <div className="game__safe items-center justify-between text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
        <h2 className="game__title text-[clamp(2rem,9vw,3rem)]">{copy.calibrating.title}</h2>
        <p className="mt-2 text-(--g-muted)">{copy.calibrating.body}</p>
      </motion.div>
      <div className="mb-[18vh] grid h-32 place-items-center" aria-live="assertive">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={label}
            className="game__title text-[7rem] leading-none text-(--g-accent) drop-shadow-[0_0_30px_rgb(255_124_190/0.7)]"
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
