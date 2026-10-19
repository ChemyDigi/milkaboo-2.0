"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Lock, Mic, MicOff, RotateCw } from "lucide-react";
import { copy } from "@/lib/copy";
import type { MicStatus } from "@/hooks/useBreathDetector";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const noop = () => () => {};

interface Props {
  status: MicStatus;
  onAllow: () => void;
}

export default function PermissionScreen({ status, onAllow }: Props) {
  const platform = useSyncExternalStore(noop, detectPlatform, () => "desktop" as Platform);
  const t = copy.permission;

  const problem =
    status === "denied"
      ? t.denied
      : status === "insecure"
        ? t.insecure
        : status === "unsupported"
          ? t.unsupported
          : status === "no-device"
            ? t.noDevice
            : status === "error"
              ? t.error
              : null;

  return (
    <div className="game__safe justify-end">
      <motion.section
        className="game__panel mx-auto w-full max-w-md p-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role={problem ? "alert" : undefined}
      >
        <span
          className={`mx-auto grid size-14 place-items-center rounded-full ${problem ? "bg-(--g-danger)/20 text-(--g-danger)" : "bg-white/10 text-(--g-accent)"}`}
        >
          {status === "insecure" ? <Lock size={26} /> : problem ? <MicOff size={26} /> : <Mic size={26} />}
        </span>

        {problem ? (
          <>
            <h2 className="mt-4 text-2xl">{problem.title}</h2>
            <p className="mt-2 text-(--g-muted)">{problem.body}</p>
            {status === "denied" && (
              <p className="mt-3 rounded-2xl bg-white/5 p-3 text-left text-sm">{t.denied[platform]}</p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              {status === "denied" || status === "insecure" ? (
                <button type="button" className="game__button" onClick={() => location.reload()}>
                  <RotateCw size={18} /> {t.reload}
                </button>
              ) : (
                <button type="button" className="game__button" onClick={onAllow}>
                  {t.retry}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-2xl">{t.title}</h2>
            <p className="mt-2 text-(--g-muted)">{t.body}</p>
            <button
              type="button"
              className="game__button mt-5 w-full"
              onClick={onAllow}
              disabled={status === "requesting"}
            >
              {status === "requesting" ? t.asking : t.allow}
            </button>
          </>
        )}
      </motion.section>
    </div>
  );
}
