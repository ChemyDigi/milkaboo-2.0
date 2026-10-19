"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Store } from "lucide-react";
import { copy } from "@/lib/copy";
import { BobaPearlIcon } from "./icons";

export type ClaimState =
  | { kind: "form"; error?: string }
  | { kind: "claiming" }
  | { kind: "done"; code: string; expiresAt: number }
  | { kind: "failed"; error: string };

interface Props {
  claim: ClaimState;
  onClaim: (email: string) => void;
  onDone: () => void;
}

const t = copy.win;
const errorText = (code: string) => t.errors[code] ?? t.errors.network;
/** errors where trying again with the same round can't help */
const final = new Set(["budget-spent", "already-claimed", "invalid-session", "round-rejected", "device-already-won"]);

/** Holds back for the 3D reveal, then asks for an email and shows the prize code. */
export default function WinScreen({ claim, onClaim, onDone }: Props) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onClaim(email);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is on screen and selectable */
    }
  };

  return (
    <div className="game__safe justify-between">
      <motion.header
        className="mt-4 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="game__title text-[clamp(2.4rem,11vw,4rem)] text-(--g-text) drop-shadow-[0_0_28px_rgb(255_179_122/0.8)]">
          {t.title}
        </h2>
        <p className="mt-1 text-(--g-muted)">{t.body}</p>
      </motion.header>

      <motion.section
        className="game__panel mx-auto w-full max-w-md p-5"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {claim.kind === "done" ? (
            <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="text-sm text-(--g-muted)">{t.codeLabel}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <output className="select-all rounded-2xl bg-white/10 px-4 py-2 font-mono text-3xl font-black tracking-widest">
                  {claim.code}
                </output>
                <button
                  type="button"
                  onClick={() => copyCode(claim.code)}
                  className="grid size-12 place-items-center rounded-full bg-white/10"
                  aria-label={copied ? t.copied : t.copy}
                >
                  {copied ? <Check size={20} className="text-(--g-good)" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 font-bold">
                <Store size={18} className="text-(--g-accent)" /> {t.redeem}
              </p>
              <p className="mt-1 text-xs text-(--g-muted)">
                {t.expires(new Date(claim.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long" }))}
              </p>
              <button type="button" className="game__button game__button--ghost mt-5 w-full" onClick={onDone}>
                {t.playAgain}
              </button>
            </motion.div>
          ) : claim.kind === "failed" ? (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" role="alert">
              <p>{errorText(claim.error)}</p>
              <button type="button" className="game__button game__button--ghost mt-5 w-full" onClick={onDone}>
                {t.playAgain}
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} className="flex flex-col gap-3" exit={{ opacity: 0 }}>
              <label htmlFor="win-email" className="flex items-center gap-2 font-bold">
                <BobaPearlIcon size={18} className="text-(--g-accent)" /> {t.emailHint}
              </label>
              <input
                id="win-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={t.emailPlaceholder}
                aria-label={t.emailLabel}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-2xl border border-(--g-line) bg-white/10 px-4 text-base text-(--g-text) placeholder:text-(--g-muted)/70 focus-visible:outline-(--g-accent)"
              />
              {claim.kind === "form" && claim.error && (
                <p className="text-sm text-(--g-danger)" role="alert">
                  {errorText(claim.error)}
                </p>
              )}
              <button type="submit" className="game__button w-full" disabled={claim.kind === "claiming"}>
                {claim.kind === "claiming" ? t.claiming : t.claim}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}

export const isFinalClaimError = (error: string) => final.has(error);
