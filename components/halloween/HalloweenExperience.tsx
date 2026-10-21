"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Sparkles, X, ChevronRight, Award } from "lucide-react";
import Game from "@/components/ui/Game";

interface FlavorCard {
  id: string;
  name: string;
  subName: string;
  ghostTitle: string;
  desc: string;
  image: string;
  glowColor: string;
  borderGlow: string;
  textGlow: string;
  textColor: string;
  badgeBg: string;
}

const FLAVORS: FlavorCard[] = [
  {
    id: "haunted-apple",
    name: "HAUNTED",
    subName: "APPLE",
    ghostTitle: "The Spooky Phantom",
    desc: "Crisp green apple matcha boba hijacked by a cackling ectoplasm spirit! Zesty, refreshing, and dangerously punchy.",
    image: "/images/halloween/haunted_apple.jpg",
    glowColor: "rgba(139, 255, 193, 0.4)",
    borderGlow: "rgba(139, 255, 193, 0.6)",
    textGlow: "0 0 16px rgba(139, 255, 193, 0.9), 0 0 32px rgba(139, 255, 193, 0.5)",
    textColor: "#a3ff84",
    badgeBg: "rgba(34, 197, 94, 0.2)",
  },
  {
    id: "blackcurrant-beast",
    name: "BLACKCURRENT",
    subName: "BEAST",
    ghostTitle: "The Horned Shadow",
    desc: "Rich, shadowy dark violet blackcurrant loaded with juicy popping pearls. Bewitched by the mischievous shadow beast.",
    image: "/images/halloween/blackcurrant_beast.jpg",
    glowColor: "rgba(192, 132, 252, 0.45)",
    borderGlow: "rgba(192, 132, 252, 0.65)",
    textGlow: "0 0 16px rgba(192, 132, 252, 0.95), 0 0 32px rgba(168, 85, 247, 0.6)",
    textColor: "#c084fc",
    badgeBg: "rgba(168, 85, 247, 0.25)",
  },
  {
    id: "casper-custard",
    name: "CASPER",
    subName: "CUSTARD",
    ghostTitle: "The Friendly Sprite",
    desc: "Creamy golden vanilla custard boba guarded by a friendly sweet ghost. Velvety, warm, and delightfully enchanting.",
    image: "/images/halloween/casper_custard.jpg",
    glowColor: "rgba(254, 215, 120, 0.45)",
    borderGlow: "rgba(254, 215, 120, 0.65)",
    textGlow: "0 0 16px rgba(254, 215, 120, 0.95), 0 0 32px rgba(245, 158, 11, 0.5)",
    textColor: "#fed778",
    badgeBg: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: "wicked-rose",
    name: "WICKED",
    subName: "ROSE",
    ghostTitle: "The Ghost Princess",
    desc: "Fragrant rose blossom milk tea topped with boba and magical rose petal dew, claimed by the stylish spooky princess.",
    image: "/images/halloween/wicked_rose.jpg",
    glowColor: "rgba(255, 140, 186, 0.5)",
    borderGlow: "rgba(255, 140, 186, 0.7)",
    textGlow: "0 0 16px rgba(255, 140, 186, 0.95), 0 0 32px rgba(244, 63, 94, 0.55)",
    textColor: "#ff7cbe",
    badgeBg: "rgba(244, 63, 94, 0.25)",
  },
];

export default function HalloweenExperience() {
  const [gameActive, setGameActive] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorCard | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#0d0618] text-[#f6f0ff] selection:bg-[#ff7cbe] selection:text-[#241a33] overflow-x-hidden font-sans">
      {/* Dynamic Animated Fog & Spooky Lighting Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-purple-900/25 blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[700px] w-[700px] rounded-full bg-fuchsia-900/20 blur-[180px]" />
        <div className="absolute bottom-10 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-950/40 blur-[140px]" />
        
        {/* Floating Ghost Orbs & Particle Specks */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(180,60,255,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Floating Animated Ghost Decors */}
      <motion.div
        className="pointer-events-none absolute top-24 left-[10%] z-10 hidden lg:block opacity-65"
        animate={{
          y: [0, -18, 0],
          x: [0, 8, 0],
          rotate: [-3, 3, -3],
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
        className="pointer-events-none absolute top-40 right-[12%] z-10 hidden lg:block opacity-60"
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
          rotate: [4, -4, 4],
        }}
        transition={{
          duration: 6.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(200,100,255,0.8)]">✨</span>
      </motion.div>

      {/* Main Content Container (No Navigation Bar as requested) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8 pt-6 pb-20">
          
          {/* Left Hero Content */}
          <motion.div 
            className="flex flex-col items-center text-center lg:items-start lg:text-left lg:col-span-6 xl:col-span-5"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* "THE GHOSTS HAVE TAKEN OVER!" Headline */}
            <div className="relative mb-6">
              <motion.span 
                className="block text-2xl font-black uppercase tracking-[0.25em] text-[#d6c7ff]"
                style={{
                  fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                  textShadow: "0 0 14px rgba(180, 100, 255, 0.7)",
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                THE
              </motion.span>
              
              <motion.h1
                className="mt-1 text-6xl sm:text-7xl xl:text-8xl font-black uppercase tracking-wider text-white"
                style={{
                  fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                  lineHeight: 0.95,
                  textShadow: "0 0 25px #c084fc, 0 0 50px #9333ea, 0 0 80px rgba(147, 51, 234, 0.7)",
                  WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
                }}
                animate={{
                  textShadow: [
                    "0 0 25px #c084fc, 0 0 50px #9333ea, 0 0 80px rgba(147, 51, 234, 0.7)",
                    "0 0 35px #e879f9, 0 0 65px #a855f7, 0 0 95px rgba(217, 70, 239, 0.8)",
                    "0 0 25px #c084fc, 0 0 50px #9333ea, 0 0 80px rgba(147, 51, 234, 0.7)",
                  ]
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                GHOSTS
              </motion.h1>

              <motion.h2 
                className="mt-2 text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight uppercase text-[#fdf8ff]"
                style={{
                  fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                  textShadow: "0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 124, 190, 0.5)",
                }}
              >
                HAVE TAKEN OVER!
              </motion.h2>
            </div>

            {/* Description Paragraph */}
            <motion.p 
              className="max-w-md text-base sm:text-lg leading-relaxed text-[#c7bcd8]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Our delicious Milkaboo flavours have been conquered by mischievous ghosts! 
              Play a game, win the challenge, and claim a <span className="font-extrabold text-[#ff7cbe] drop-shadow-[0_0_12px_rgba(255,124,190,0.8)]">FREE drink!</span>
            </motion.p>

            {/* PLAY & WIN Button with Radiant Glow & Controller Icon */}
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <button
                type="button"
                onClick={() => setGameActive(true)}
                className="group relative inline-flex items-center justify-center gap-3.5 overflow-hidden rounded-full px-9 py-4 font-black tracking-wider uppercase text-[#241a33] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(254,183,124,0.65)] hover:shadow-[0_0_55px_rgba(255,124,190,0.85)] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #fed778 0%, #feb273 50%, #ff8ab2 100%)",
                }}
              >
                {/* Subtle sheen highlight */}
                <span className="absolute inset-0 bg-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Gamepad2 className="h-6 w-6 text-[#241a33] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="text-lg sm:text-xl font-black">PLAY & WIN</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Right Hero Visual Showcase (Giant Boba Cup + Haunted Castle + Swirling Ghosts) */}
          <motion.div 
            className="relative flex justify-center items-center lg:col-span-6 xl:col-span-7"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glowing Aura Ring Behind Visual */}
            <div className="absolute -inset-4 rounded-3xl bg-linear-to-r from-fuchsia-600/30 via-purple-600/25 to-pink-500/30 blur-2xl -z-10" />

            <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(180,60,255,0.25)]">
              {/* Floating Hero Image Container */}
              <motion.div
                className="relative aspect-4/3 w-full"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/halloween/hero_cup.jpg"
                  alt="Milkaboo Halloween Conquered Boba Cup"
                  fill
                  priority
                  className="object-cover object-center transform scale-102 hover:scale-105 transition-transform duration-700"
                />

                {/* Subtle Gradient Overlays for integration */}
                <div className="absolute inset-0 bg-linear-to-t from-[#0d0618] via-transparent to-transparent opacity-60" />
                <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-transparent to-purple-950/40" />

                {/* Interactive Badge on image corner */}
                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-950/70 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </span>
                  <span className="text-xs font-bold tracking-wide text-pink-200">LIMITED EDITION</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ===================== FLAVOUR SELECTION SECTION ===================== */}
        <section className="relative mt-12 pt-10">
          
          {/* Section Heading & Tagline */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.h3
              className="text-2xl sm:text-3xl font-black uppercase tracking-[0.2em] text-[#f2eafb]"
              style={{
                fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                textShadow: "0 0 15px rgba(255, 255, 255, 0.4)",
              }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              CHOOSE YOUR
            </motion.h3>

            <motion.h2
              className="mt-1 text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-[#ff7cbe]"
              style={{
                fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                textShadow: "0 0 20px #ff7cbe, 0 0 45px rgba(255, 124, 190, 0.7), 0 0 70px rgba(219, 39, 119, 0.5)",
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 xl:gap-7">
            {FLAVORS.map((flavor, index) => (
              <motion.div
                key={flavor.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#160d26]/80 p-3 backdrop-blur-md cursor-pointer transition-all duration-300"
                style={{
                  boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.02)`,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  borderColor: flavor.borderGlow,
                  boxShadow: `0 20px 40px rgba(0, 0, 0, 0.8), 0 0 35px ${flavor.glowColor}`,
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                onClick={() => setSelectedFlavor(flavor)}
              >
                {/* Glowing Card Aura on Hover */}
                <div
                  className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: flavor.glowColor }}
                />

                {/* Card Image Container */}
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-black/40">
                  <Image
                    src={flavor.image}
                    alt={`${flavor.name} ${flavor.subName} Halloween Drink`}
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#160d26] via-transparent to-transparent opacity-60" />
                  
                  {/* Hover Quick Challenge Chip */}
                  <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between rounded-lg bg-black/70 px-3 py-2 backdrop-blur-md">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      Free this flavour
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </div>
                </div>

                {/* Card Typography Content */}
                <div className="mt-4 mb-2 flex flex-col items-center text-center px-1">
                  <h4
                    className="text-xl sm:text-2xl font-black uppercase tracking-wider transition-colors duration-300"
                    style={{
                      fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                      color: flavor.textColor,
                      textShadow: flavor.textGlow,
                      lineHeight: 1.1,
                    }}
                  >
                    <div>{flavor.name}</div>
                    <div>{flavor.subName}</div>
                  </h4>

                  <span className="mt-2 text-xs font-medium text-[#b5a3cf]">
                    {flavor.ghostTitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* ===================== FLAVOR DETAILS MODAL ===================== */}
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
                className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Flavor Cup Image Preview */}
                <div className="relative h-64 w-48 overflow-hidden rounded-2xl shadow-xl border border-white/15">
                  <Image
                    src={selectedFlavor.image}
                    alt={selectedFlavor.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="mt-5">
                  <span className="inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase text-white/90" style={{ background: selectedFlavor.badgeBg }}>
                    {selectedFlavor.ghostTitle}
                  </span>
                  
                  <h3
                    className="mt-3 text-3xl font-black uppercase tracking-wider"
                    style={{
                      fontFamily: "var(--g-font-display, var(--font-bherisi, sans-serif))",
                      color: selectedFlavor.textColor,
                      textShadow: selectedFlavor.textGlow,
                    }}
                  >
                    {selectedFlavor.name} {selectedFlavor.subName}
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
                    className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-bold text-[#241a33] transition-all hover:scale-103 cursor-pointer shadow-lg"
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
                    className="w-full text-center text-xs text-[#a495bf] hover:text-white py-1 transition-colors"
                  >
                    Close & pick another
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== FULLSCREEN GAME OVERLAY MODAL ===================== */}
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
