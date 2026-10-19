"use client";

import { Volume2, VolumeX } from "lucide-react";
import { copy } from "@/lib/copy";

export default function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? copy.unmute : copy.mute}
      className="game__panel pointer-events-auto absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-30 grid size-11 place-items-center rounded-full!"
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
