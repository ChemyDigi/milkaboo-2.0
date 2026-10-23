"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { copy } from "@/lib/copy";
import { BatIcon } from "./icons";

interface Props {
  attemptsLeft: number | null;
  busy: boolean;
  notice: string | null;
  onStart: () => void;
}

export default function IntroScreen({ attemptsLeft, busy, notice, onStart }: Props) {
  const out = attemptsLeft === 0;
  return (
    <div className="game__safe justify-between">
      <motion.header
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src="/images/logo.png" alt="Milkaboo" width={144} height={225} priority className="h-12 w-auto" />
        <h1 className="game__title game__title--haunt mt-2 text-[clamp(2.1rem,10vw,3.5rem)] text-(--g-text)">
          {copy.title}
        </h1>
        <p className="mt-1 max-w-xs text-sm text-(--g-muted) [@media(max-height:700px)]:hidden">{copy.tagline}</p>
      </motion.header>

      <motion.section
        className="game__panel mx-auto w-full max-w-md p-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center gap-2">
          {notice && (
            <p className="text-center text-sm text-(--g-danger)" role="alert">
              {notice}
            </p>
          )}
          <button type="button" className="game__button w-full" onClick={onStart} disabled={busy || out}>
            {copy.start}
          </button>
          <p className="flex items-center gap-1.5 text-sm text-(--g-muted)" aria-live="polite">
            <BatIcon size={16} />
            {attemptsLeft === null ? " " : out ? copy.noTriesLeft : copy.triesLeft(attemptsLeft)}
          </p>
          <p className="text-center text-xs text-(--g-muted)/80">{copy.hygiene}</p>
        </div>
      </motion.section>
    </div>
  );
}
