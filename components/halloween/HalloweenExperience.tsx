"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Gamepad2, Sparkles, X, ChevronRight, Award } from "lucide-react";
import Game from "@/components/ui/Game";

interface FlavorCard {
  id: string;
  name: string;
  subName: string;
  fullName: string;
  ghostTitle: string;
  desc: string;
  cupImage: string;
  posterImage?: string;
  // Transparent cut-out of the poster's ghost + cup (same size as the poster), drawn
  // unclipped on top of it so the ghost breaks out over the top edge of the card
  ghostImage?: string;
  themeColor: string;
  glowColor: string;
  borderGlow: string;
  textGlow: string;
  badgeBg: string;
  ghostType: "apple" | "beast" | "custard" | "rose";
}

const FLAVORS: FlavorCard[] = [
  {
    id: "haunted-apple",
    name: "HAUNTED",
    subName: "APPLE",
    fullName: "HAUNTED APPLE",
    ghostTitle: "The Spooky Phantom",
    desc: "Crisp green apple matcha boba hijacked by a cackling ectoplasm spirit! Zesty, refreshing, and dangerously punchy.",
    cupImage: "/images/halloween/cup-apple-tilt.png",
    posterImage: "/images/halloween/Neon Ghost Matcha Boo Poster.png",
    ghostImage: "/images/halloween/ghost-cutout-apple.png",
    themeColor: "#a3ff84",
    glowColor: "rgba(139, 255, 132, 0.4)",
    borderGlow: "rgba(163, 255, 132, 0.65)",
    textGlow: "0 0 16px rgba(163, 255, 132, 0.95), 0 0 32px rgba(34, 197, 94, 0.6)",
    badgeBg: "rgba(34, 197, 94, 0.25)",
    ghostType: "apple",
  },
  {
    id: "blackcurrant-beast",
    name: "BLACKCURRENT",
    subName: "BEAST",
    fullName: "BLACKCURRENT BEAST",
    ghostTitle: "The Horned Shadow",
    desc: "Rich, shadowy dark violet blackcurrant loaded with juicy popping pearls. Bewitched by the mischievous shadow beast.",
    cupImage: "/images/halloween/cup-currant-tilt.png",
    posterImage: "/images/halloween/Possessed Blackcurrant Bubble Tea.png",
    ghostImage: "/images/halloween/ghost-cutout-currant.png",
    themeColor: "#c084fc",
    glowColor: "rgba(192, 132, 252, 0.45)",
    borderGlow: "rgba(192, 132, 252, 0.7)",
    textGlow: "0 0 16px rgba(192, 132, 252, 0.95), 0 0 32px rgba(168, 85, 247, 0.6)",
    badgeBg: "rgba(168, 85, 247, 0.25)",
    ghostType: "beast",
  },
  {
    id: "casper-custard",
    name: "CASPER",
    subName: "CUSTARD",
    fullName: "CASPER CUSTARD",
    ghostTitle: "The Friendly Sprite",
    desc: "Creamy golden vanilla custard boba guarded by a friendly sweet ghost. Velvety, warm, and delightfully enchanting.",
    cupImage: "/images/halloween/cup-custard.png",
    posterImage: "/images/halloween/Milka Boo Vanilla Ghost Bubble Tea.png",
    ghostImage: "/images/halloween/ghost-cutout-custard.png",
    themeColor: "#fed778",
    glowColor: "rgba(254, 215, 120, 0.45)",
    borderGlow: "rgba(254, 215, 120, 0.7)",
    textGlow: "0 0 16px rgba(254, 215, 120, 0.95), 0 0 32px rgba(245, 158, 11, 0.6)",
    badgeBg: "rgba(245, 158, 11, 0.25)",
    ghostType: "custard",
  },
  {
    id: "wicked-rose",
    name: "WICKED",
    subName: "ROSE",
    fullName: "WICKED ROSE",
    ghostTitle: "The Ghost Princess",
    desc: "Fragrant rose blossom milk tea topped with boba and magical rose petal dew, claimed by the stylish spooky princess.",
    cupImage: "/images/halloween/cup-rose-tilt.png",
    posterImage: "/images/halloween/Pink Boo Bubble Tea Ghost.png",
    ghostImage: "/images/halloween/ghost-cutout-rose.png",
    themeColor: "#ff7cbe",
    glowColor: "rgba(255, 124, 190, 0.5)",
    borderGlow: "rgba(255, 124, 190, 0.75)",
    textGlow: "0 0 16px rgba(255, 124, 190, 0.95), 0 0 32px rgba(244, 63, 94, 0.6)",
    badgeBg: "rgba(244, 63, 94, 0.25)",
    ghostType: "rose",
  },
];

// Stylized ghost character badge floating over each flavor cup
function FlavorGhostBadge({ type, color }: { type: FlavorCard["ghostType"]; color: string }) {
  if (type === "apple") {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse"
            style={{ background: color }}
          />
          <div className="relative flex items-center gap-1 rounded-full px-3 py-1 bg-black/60 border border-[#a3ff84]/50 backdrop-blur-md shadow-lg">
            <span className="text-xl">🍏</span>
            <span className="text-sm font-black text-[#a3ff84] drop-shadow-[0_0_8px_rgba(163,255,132,0.8)]">
              👻 Phantom
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === "beast") {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={{ y: [0, -9, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse"
            style={{ background: color }}
          />
          <div className="relative flex items-center gap-1 rounded-full px-3 py-1 bg-black/60 border border-[#c084fc]/50 backdrop-blur-md shadow-lg">
            <span className="text-xl">😈</span>
            <span className="text-sm font-black text-[#c084fc] drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">
              👾 Beast
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === "custard") {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={{ y: [0, -7, 0], rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse"
            style={{ background: color }}
          />
          <div className="relative flex items-center gap-1 rounded-full px-3 py-1 bg-black/60 border border-[#fed778]/50 backdrop-blur-md shadow-lg">
            <span className="text-xl">⭐</span>
            <span className="text-sm font-black text-[#fed778] drop-shadow-[0_0_8px_rgba(254,215,120,0.8)]">
              👻 Sprite
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center"
      animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        <div
          className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse"
          style={{ background: color }}
        />
        <div className="relative flex items-center gap-1 rounded-full px-3 py-1 bg-black/60 border border-[#ff7cbe]/50 backdrop-blur-md shadow-lg">
          <span className="text-xl">👑</span>
          <span className="text-sm font-black text-[#ff7cbe] drop-shadow-[0_0_8px_rgba(255,124,190,0.8)]">
            👻 Princess
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Builds a corner cobweb: radial threads fanning out from (0,0) joined by sagging spiral rings
function cobwebPath(size: number) {
  const angles = [8, 22, 36, 50, 64, 78].map((d) => (d * Math.PI) / 180);
  const rings = [0.16, 0.32, 0.48, 0.66, 0.84].map((f) => f * size);
  const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  let d = angles.map((a) => `M0 0 L${pt(size, a)}`).join(" ");
  for (const r of rings) {
    d += ` M${pt(r, angles[0])}`;
    for (let i = 1; i < angles.length; i++) {
      d += ` Q${pt(r * 0.86, (angles[i - 1] + angles[i]) / 2)} ${pt(r, angles[i])}`;
    }
  }
  return d;
}

const COBWEB_PATH = cobwebPath(260);

const BAT_PATH =
  "M32 10 C30 6 27 5 26 8 C22 4 14 3 6 8 C10 9 12 12 12 15 C16 13 20 14 22 18 C25 15 29 16 32 22 C35 16 39 15 42 18 C44 14 48 13 52 15 C52 12 54 9 58 8 C50 3 42 4 38 8 C37 5 34 6 32 10 Z";

const BATS = [
  { top: "14%", size: 46, duration: 16, delay: 0, reverse: false },
  { top: "30%", size: 30, duration: 21, delay: 6, reverse: true },
  { top: "8%", size: 24, duration: 25, delay: 11, reverse: false },
];

// Fixed (not random) so server and client render identically
const SPARKS = [
  { left: 4, bottom: 18, size: 5, duration: 7, delay: 0, color: "#a3ff84" },
  { left: 11, bottom: 42, size: 3, duration: 9, delay: 2.5, color: "#c084fc" },
  { left: 19, bottom: 10, size: 4, duration: 8, delay: 4, color: "#ff7cbe" },
  { left: 27, bottom: 55, size: 3, duration: 10, delay: 1, color: "#fed778" },
  { left: 35, bottom: 22, size: 5, duration: 7.5, delay: 5.5, color: "#c084fc" },
  { left: 44, bottom: 8, size: 3, duration: 9.5, delay: 3, color: "#a3ff84" },
  { left: 52, bottom: 38, size: 4, duration: 8.5, delay: 6.5, color: "#ff7cbe" },
  { left: 60, bottom: 15, size: 3, duration: 11, delay: 0.5, color: "#fed778" },
  { left: 67, bottom: 48, size: 5, duration: 7, delay: 3.5, color: "#c084fc" },
  { left: 74, bottom: 12, size: 3, duration: 9, delay: 7, color: "#a3ff84" },
  { left: 81, bottom: 30, size: 4, duration: 8, delay: 2, color: "#ff7cbe" },
  { left: 88, bottom: 60, size: 3, duration: 10.5, delay: 4.5, color: "#fed778" },
  { left: 95, bottom: 20, size: 5, duration: 7.5, delay: 1.5, color: "#c084fc" },
];

// Tombstones / crosses for the graveyard silhouette (x positions in a 1440-wide viewBox)
const TOMBSTONES = [
  { x: 120, w: 34, h: 54, tilt: -6 },
  { x: 300, w: 26, h: 40, tilt: 4 },
  { x: 520, w: 30, h: 46, tilt: -3 },
  { x: 930, w: 36, h: 58, tilt: 5 },
  { x: 1110, w: 26, h: 38, tilt: -5 },
  { x: 1370, w: 30, h: 48, tilt: 3 },
];
const CROSSES = [
  { x: 210, h: 62, tilt: 5 },
  { x: 700, h: 50, tilt: -7 },
  { x: 1020, h: 66, tilt: -3 },
];

// Creepy ambient layer behind the flavour cards: cobwebs, spider, bats, ghost-light sparks, graveyard & fog
function SpookyFlavorBackdrop() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
        }}
        aria-hidden
      >
        {/* Corner cobwebs */}
        <svg
          className="absolute top-0 left-0 w-40 sm:w-56 lg:w-64 opacity-25"
          viewBox="0 0 260 260"
          fill="none"
          stroke="#e9d5ff"
          strokeWidth="1"
        >
          <path d={COBWEB_PATH} />
        </svg>
        <svg
          className="absolute top-0 right-0 w-36 sm:w-48 lg:w-56 -scale-x-100 opacity-20"
          viewBox="0 0 260 260"
          fill="none"
          stroke="#e9d5ff"
          strokeWidth="1"
        >
          <path d={COBWEB_PATH} />
        </svg>

        {/* Dangling spider on its thread */}
        <motion.div
          className="absolute top-0 right-[9%] sm:right-[12%] flex flex-col items-center origin-top"
          animate={{ y: [0, 46, 12, 46, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-28 sm:h-40 w-px bg-linear-to-b from-transparent to-[#e9d5ff]/45" />
          <svg width="26" height="26" viewBox="0 0 26 26" className="-mt-1 drop-shadow-[0_0_6px_rgba(192,132,252,0.7)]">
            <g stroke="#1a0f2b" strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path d="M10 12 Q4 8 2 3 M10 13 Q4 13 1 11 M10 14 Q5 17 2 21 M11 15 Q8 20 7 25" />
              <path d="M16 12 Q22 8 24 3 M16 13 Q22 13 25 11 M16 14 Q21 17 24 21 M15 15 Q18 20 19 25" />
            </g>
            <ellipse cx="13" cy="15" rx="4.5" ry="5.5" fill="#1a0f2b" />
            <circle cx="13" cy="9" r="3" fill="#1a0f2b" />
            <circle cx="11.8" cy="8.6" r="0.9" fill="#ff7cbe" />
            <circle cx="14.2" cy="8.6" r="0.9" fill="#ff7cbe" />
          </svg>
        </motion.div>

        {/* Bats flapping across */}
        {BATS.map((bat, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: bat.top, left: 0 }}
            initial={{ x: bat.reverse ? "105vw" : "-10vw" }}
            animate={{
              x: bat.reverse ? ["105vw", "-10vw"] : ["-10vw", "105vw"],
              y: [0, -24, 10, -16, 0],
            }}
            transition={{
              x: { duration: bat.duration, repeat: Infinity, delay: bat.delay, ease: "linear", repeatDelay: 4 },
              y: { duration: bat.duration / 3, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <motion.svg
              width={bat.size}
              height={bat.size / 2}
              viewBox="0 0 64 32"
              className={`opacity-60 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] ${bat.reverse ? "-scale-x-100" : ""}`}
              animate={{ scaleY: [1, 0.35, 1] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d={BAT_PATH} fill="#0a0414" />
            </motion.svg>
          </motion.div>
        ))}

        {/* Floating ghost-light sparks */}
        {SPARKS.map((spark, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${spark.left}%`,
              bottom: `${spark.bottom}%`,
              width: spark.size,
              height: spark.size,
              background: spark.color,
              boxShadow: `0 0 ${spark.size * 3}px ${spark.color}`,
            }}
            animate={{ y: [0, -140], x: [0, 12, -8, 0], opacity: [0, 0.85, 0] }}
            transition={{ duration: spark.duration, repeat: Infinity, delay: spark.delay, ease: "easeOut" }}
          />
        ))}

        {/* Graveyard silhouette along the bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full h-40 sm:h-52 drop-shadow-[0_-6px_18px_rgba(147,51,234,0.35)]"
          viewBox="0 0 1440 220"
          preserveAspectRatio="xMidYMax slice"
        >
          <g fill="#08030f">
            {/* Iron fence */}
            {Array.from({ length: 14 }, (_, i) => (
              <path key={i} d={`M${560 + i * 18} 178 V136 l3 -8 l3 8 V178 Z`} />
            ))}
            <rect x="556" y="146" width="256" height="4" />
            <rect x="556" y="166" width="256" height="4" />

            {TOMBSTONES.map((t, i) => (
              <rect
                key={i}
                x={t.x}
                y={182 - t.h}
                width={t.w}
                height={t.h + 20}
                rx={t.w / 2}
                transform={`rotate(${t.tilt} ${t.x + t.w / 2} 182)`}
              />
            ))}
            {CROSSES.map((c, i) => (
              <g key={i} transform={`rotate(${c.tilt} ${c.x} 182)`}>
                <rect x={c.x - 3} y={182 - c.h} width="6" height={c.h + 10} />
                <rect x={c.x - 14} y={182 - c.h + 14} width="28" height="6" />
              </g>
            ))}

            {/* Dead tree */}
            <path
              d="M1236 182 C1240 140 1238 110 1230 80 C1222 60 1204 48 1188 42 M1232 92 C1250 74 1270 66 1292 62 M1236 120 C1256 112 1270 100 1278 86 M1229 70 C1232 50 1240 36 1252 26"
              stroke="#08030f"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rolling ground */}
            <path d="M0 220 V176 Q180 150 380 170 T780 166 T1160 174 T1440 160 V220 Z" />
          </g>
        </svg>

        {/* Low drifting fog banks */}
        <motion.div
          className="absolute -bottom-10 -left-1/4 h-44 w-[90%] rounded-full bg-[#c084fc]/12 blur-3xl"
          animate={{ x: ["0%", "18%", "0%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-14 -right-1/4 h-48 w-[85%] rounded-full bg-[#ff7cbe]/10 blur-3xl"
          animate={{ x: ["0%", "-20%", "0%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </MotionConfig>
  );
}

export default function HalloweenExperience() {
  const [gameActive, setGameActive] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorCard | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#0d0618] text-[#f6f0ff] selection:bg-[#ff7cbe] selection:text-[#241a33] overflow-x-hidden font-sans">
      {/* External Dripping Halloween Font for exact screenshot match */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Creepster&display=swap"
      />

      <style jsx global>{`
        .font-creepster {
          font-family: "Creepster", var(--g-font-display, var(--font-bherisi, cursive, sans-serif));
          letter-spacing: 0.04em;
        }
      `}</style>

      {/* Spooky Animated Fog & Ethereal Glowing Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-purple-900/20 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 h-[700px] w-[700px] rounded-full bg-fuchsia-900/20 blur-[180px]" />
        <div className="absolute bottom-10 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-950/30 blur-[140px]" />
      </div>

      {/* Floating Animated Ghost Emojis */}
      <motion.div
        className="pointer-events-none fixed top-28 left-[6%] z-20 hidden lg:block opacity-65"
        animate={{
          y: [0, -18, 0],
          x: [0, 8, 0],
          rotate: [-4, 4, -4],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">👻</span>
      </motion.div>

      <motion.div
        className="pointer-events-none fixed top-36 right-[8%] z-20 hidden lg:block opacity-65"
        animate={{
          y: [0, 18, 0],
          x: [0, -8, 0],
          rotate: [4, -4, 4],
        }}
        transition={{
          duration: 6.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(255,124,190,0.8)]">🦇</span>
      </motion.div>

      {/* ========================================================================= */}
      {/* HERO SECTION: Full-width haunted mansion background with floating cup   */}
      {/* (NO navigation bar on top, exactly matching the screenshot)               */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] xl:min-h-[880px] flex items-center justify-center overflow-hidden">
        {/* Full-width Haunted Mansion Background Image (masked so it dissolves into the page) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
          }}
        >
          <Image
            src="/images/halloween/hero_mansion_bg.png"
            alt="Neon Ghosts at the Haunted Mansion"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[72%_center] lg:object-center select-none"
          />

          {/* Left vignette gradient for high contrast & perfect text readability */}
          <div className="absolute inset-0 bg-linear-to-r from-[#0d0618]/95 via-[#0d0618]/65 to-transparent w-full lg:w-[65%]" />

          {/* Top subtle fade */}
          <div className="absolute top-0 inset-x-0 h-24 bg-linear-to-b from-[#0d0618]/60 to-transparent" />

          {/* Bottom seamless transition into the rest of the page */}
          <div className="absolute bottom-0 inset-x-0 h-64 bg-linear-to-t from-[#0d0618]/80 via-[#0d0618]/40 to-transparent" />
        </div>

        {/* Hero Interactive Content Container */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

            {/* Left Column: Headlines, Description & Play & Win CTA */}
            <motion.div
              className="flex flex-col items-center text-center lg:items-start lg:text-left lg:col-span-6 xl:col-span-5"
              initial={{ opacity: 0, x: -35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* "THE" */}
              <motion.span
                className="block text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] text-[#d6c7ff]"
                style={{
                  fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                  textShadow: "0 0 14px rgba(180, 100, 255, 0.7)",
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                THE
              </motion.span>

              {/* "GHOSTS" - Giant Dripping Neon Creepster Font */}
              <motion.h1
                className="font-creepster mt-1 text-7xl sm:text-8xl xl:text-9xl font-black uppercase tracking-wider text-white select-none"
                style={{
                  lineHeight: 0.92,
                  textShadow:
                    "0 0 20px #c084fc, 0 0 45px #9333ea, 0 0 85px rgba(147, 51, 234, 0.85)",
                  WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.35)",
                }}
                animate={{
                  textShadow: [
                    "0 0 20px #c084fc, 0 0 45px #9333ea, 0 0 85px rgba(147, 51, 234, 0.85)",
                    "0 0 35px #f472b6, 0 0 65px #c084fc, 0 0 100px rgba(217, 70, 239, 0.95)",
                    "0 0 20px #c084fc, 0 0 45px #9333ea, 0 0 85px rgba(147, 51, 234, 0.85)",
                  ],
                }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              >
                GHOSTS
              </motion.h1>

              {/* "HAVE TAKEN OVER!" - Dripping Creepster */}
              <motion.h2
                className="font-creepster mt-2 text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight uppercase text-[#fdf8ff] select-none"
                style={{
                  textShadow:
                    "0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 124, 190, 0.75), 0 0 50px rgba(244, 63, 94, 0.5)",
                }}
              >
                HAVE TAKEN OVER!
              </motion.h2>

              {/* Spooky Story Paragraph */}
              <motion.p
                className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-[#d7cced]"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Our delicious Milkaboo flavours have been conquered by mischievous ghosts!
                Play a game, win the challenge, and claim a{" "}
                <span className="font-extrabold text-[#ff7cbe] drop-shadow-[0_0_12px_rgba(255,124,190,0.9)]">
                  FREE drink!
                </span>
              </motion.p>

              {/* PLAY & WIN Button with Warm Glowing Gradient */}
              <motion.div
                className="mt-8 flex flex-col sm:flex-row items-center gap-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => setGameActive(true)}
                  className="group relative inline-flex items-center justify-center gap-3.5 overflow-hidden rounded-full px-9 py-4 font-black tracking-wider uppercase text-[#241a33] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(254,183,124,0.65)] hover:shadow-[0_0_60px_rgba(255,124,190,0.9)] cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #fed778 0%, #feb273 50%, #ff8ab2 100%)",
                  }}
                >
                  {/* Subtle sheen highlight */}
                  <span className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Gamepad2 className="h-6 w-6 text-[#241a33] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="text-lg sm:text-xl font-black">PLAY & WIN</span>
                </button>
              </motion.div>
            </motion.div>

            {/* Right Column: Milkaboo Cup with Ghosts placed over the misty mansion */}
            <motion.div
              className="relative flex justify-center items-center lg:col-span-6 xl:col-span-7"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Cup Container with organic floating animation */}
              <motion.div
                className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[530px] xl:max-w-[570px] aspect-4/5 filter drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                animate={{
                  y: [0, -14, 0],
                  rotate: [0, 0.8, 0, -0.8, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Purple Ectoplasm Aura behind the cup */}
                <div className="absolute inset-x-8 bottom-8 top-20 rounded-full bg-fuchsia-600/30 blur-3xl -z-10 animate-pulse" />

                {/* The Transparent Cup With Ghosts Image */}
                <Image
                  src="/images/halloween/hero_cup_ghosts.png"
                  alt="Milka Boo Bubble Tea Ghosts"
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 580px"
                  className="object-contain object-bottom pointer-events-none select-none"
                />

              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Glowing ectoplasm mist straddling the hero / flavour section seam */}
      <div className="pointer-events-none relative z-5 h-0" aria-hidden>
        <motion.div
          className="absolute inset-x-0 -top-40 h-80"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(192, 132, 252, 0.28) 0%, rgba(217, 70, 239, 0.12) 45%, transparent 75%)",
            filter: "blur(30px)",
          }}
          animate={{ opacity: [0.7, 1, 0.7], scaleX: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-x-0 -top-16 h-32"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 30% 50%, rgba(255, 124, 190, 0.14) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 72% 50%, rgba(163, 255, 132, 0.08) 0%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* FLAVOUR SELECTION SECTION: 4 Conquered Flavour Cards                      */}
      {/* ========================================================================= */}
      <div className="relative">
        <SpookyFlavorBackdrop />

        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-40 sm:px-6 lg:px-8">

          {/* Section Heading & Tagline */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.h3
              className="text-2xl sm:text-3xl font-black uppercase tracking-[0.22em] text-[#e8dcfa]"
              style={{
                fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                textShadow: "0 0 15px rgba(255, 255, 255, 0.45)",
              }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              CHOOSE YOUR
            </motion.h3>

            <motion.h2
              className="font-creepster mt-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-[#ff7cbe] select-none"
              style={{
                textShadow:
                  "0 0 20px #ff7cbe, 0 0 45px rgba(255, 124, 190, 0.8), 0 0 70px rgba(219, 39, 119, 0.6)",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              CONQUERED FLAVOUR
            </motion.h2>

            <motion.p
              className="mt-3 text-base sm:text-lg text-[#bfb0d9]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Which ghost will you challenge?
            </motion.p>
          </div>

          {/* 4 Flavour Cards Grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 xl:gap-7 ${
              FLAVORS.some((f) => f.ghostImage) ? "gap-y-24 gap-x-6 pt-20" : "gap-6"
            }`}
          >
            {FLAVORS.map((flavor, index) => (
              <motion.div
                key={flavor.id}
                className={`group relative flex flex-col ${flavor.ghostImage ? "overflow-visible" : "overflow-hidden"} rounded-3xl border border-white/10 bg-[#140b24]/90 p-4 backdrop-blur-md cursor-pointer transition-all duration-300`}
                style={{
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.02)",
                }}
                whileHover={{
                  y: -10,
                  scale: 1.025,
                  borderColor: flavor.borderGlow,
                  boxShadow: `0 20px 45px rgba(0, 0, 0, 0.85), 0 0 35px ${flavor.glowColor}`,
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                onClick={() => setSelectedFlavor(flavor)}
              >
                {/* Glowing Card Aura on Hover */}
                <div
                  className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                  style={{ background: flavor.glowColor }}
                />

                <div className="relative">
                  {/* Card Visual Stage */}
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-black/40 flex flex-col justify-between p-4">
                    {/* Full poster artwork (cup + ghost) replaces the cup & badge.
                        With a ghost cut-out, the poster is drawn taller than the stage so its
                        top (the ghost) is clipped here and re-drawn unclipped by the cut-out. */}
                    {flavor.posterImage && (
                      <>
                        <div className={`absolute inset-x-0 bottom-0 transition-transform duration-700 ease-out group-hover:scale-105 ${flavor.ghostImage ? "h-[125%]" : "top-0"}`}>
                          <Image
                            src={flavor.posterImage}
                            alt={`${flavor.fullName} Milkaboo Poster`}
                            fill
                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                            className="object-cover object-[center_30%] select-none"
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent" />
                      </>
                    )}

                    {/* Flavor Spotlight Radial Glow */}
                    <div
                      className="absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at 50% 60%, ${flavor.glowColor} 0%, transparent 70%)`,
                      }}
                    />

                    {!flavor.posterImage && (
                      <>
                        {/* Floating Ghost Character Badge at the top */}
                        <div className="relative z-10 w-full flex justify-center">
                          <FlavorGhostBadge type={flavor.ghostType} color={flavor.themeColor} />
                        </div>

                        {/* Transparent Cup PNG centered */}
                        <div className="relative z-10 mx-auto my-auto h-[78%] w-[78%] transition-transform duration-500 ease-out group-hover:scale-110">
                          <Image
                            src={flavor.cupImage}
                            alt={`${flavor.fullName} Milkaboo Cup`}
                            fill
                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                            className="object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                          />
                        </div>
                      </>
                    )}

                    {/* Hover Quick Action Pill */}
                    <div className={`relative z-10 ${flavor.posterImage ? "mt-auto" : ""} translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between rounded-xl bg-black/80 px-3.5 py-2 backdrop-blur-md border border-white/10 shadow-lg`}>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        Free this flavour
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/80" />
                    </div>
                  </div>

                  {/* Ghost cut-out: same box as the poster above, but not clipped by the stage */}
                  {flavor.ghostImage && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-[125%] transition-transform duration-700 ease-out group-hover:scale-105">
                      <Image
                        src={flavor.ghostImage}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                        className="object-cover object-[center_30%] select-none"
                        style={{ filter: `drop-shadow(0 -4px 14px ${flavor.glowColor})` }}
                      />
                    </div>
                  )}
                </div>

                {/* Card Dripping Typography at Bottom */}
                <div className="mt-5 mb-2 flex flex-col items-center text-center px-2">
                  <h4
                    className="font-creepster text-2xl sm:text-3xl font-black uppercase tracking-wider transition-colors duration-300 select-none"
                    style={{
                      color: flavor.themeColor,
                      textShadow: flavor.textGlow,
                      lineHeight: 1.15,
                    }}
                  >
                    <div>{flavor.name}</div>
                    <div>{flavor.subName}</div>
                  </h4>

                  <span className="mt-2 text-xs font-semibold text-[#b5a3cf]">
                    {flavor.ghostTitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* FLAVOUR DETAILS MODAL: Interactive Lore & Play Challenge Trigger          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedFlavor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFlavor(null)}
          >
            <motion.div
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-[#160b29] p-6 shadow-2xl sm:p-8"
              style={{
                boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px ${selectedFlavor.glowColor}`,
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedFlavor(null)}
                className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Flavor Cup Image Preview */}
                <div
                  className="relative h-64 w-52 overflow-hidden rounded-2xl p-4 flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${selectedFlavor.glowColor} 0%, rgba(22, 11, 41, 0.9) 70%)`,
                  }}
                >
                  {selectedFlavor.posterImage ? (
                    <Image
                      src={selectedFlavor.posterImage}
                      alt={selectedFlavor.fullName}
                      fill
                      sizes="208px"
                      className="object-cover object-[center_30%]"
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      <Image
                        src={selectedFlavor.cupImage}
                        alt={selectedFlavor.fullName}
                        fill
                        sizes="208px"
                        className="object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <span
                    className="inline-block rounded-full px-3.5 py-1 text-xs font-bold tracking-wide uppercase text-white/90"
                    style={{ background: selectedFlavor.badgeBg }}
                  >
                    {selectedFlavor.ghostTitle}
                  </span>

                  <h3
                    className="font-creepster mt-3 text-3xl sm:text-4xl font-black uppercase tracking-wider"
                    style={{
                      color: selectedFlavor.themeColor,
                      textShadow: selectedFlavor.textGlow,
                    }}
                  >
                    {selectedFlavor.fullName}
                  </h3>

                  <p className="mt-3 text-sm text-[#c7bcd8] leading-relaxed max-w-sm">
                    {selectedFlavor.desc}
                  </p>
                </div>

                {/* Challenge Action Button */}
                <div className="mt-6 flex w-full flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFlavor(null);
                      setGameActive(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-black text-[#241a33] transition-all hover:scale-103 cursor-pointer shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #fed778 0%, #ff8ab2 100%)",
                    }}
                  >
                    <Gamepad2 className="h-5 w-5" />
                    <span>Challenge Ghost & Win Free</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFlavor(null)}
                    className="w-full text-center text-xs text-[#a495bf] hover:text-white py-1 transition-colors cursor-pointer"
                  >
                    Close & pick another
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* FULLSCREEN GAME OVERLAY MODAL: 3D Microphone Challenge                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {gameActive && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-[#120a1f]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Exit Game Floating Bar */}
            <div className="absolute top-4 left-4 z-50">
              <button
                type="button"
                onClick={() => setGameActive(false)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-md hover:bg-black/80 hover:text-white transition-all shadow-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Exit Challenge</span>
              </button>
            </div>

            {/* Live Free The Milkaboo Cup 3D Microphone Game */}
            <div className="relative h-full w-full">
              <Game />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
