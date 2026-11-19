"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/SmoothScroll";

/* ============================================================================
 * CONFIGURATION — swap video sources or copy here
 * ========================================================================== */
const VIDEOS = {
  up: "/video/cow-hero-up.mp4",
  mid: "/video/cow-hero-mid.mp4",
  down: "/video/cow-hero-down.mp4",
} as const;

const LERP_FACTOR = 0.15; // Smoothness for requestAnimationFrame lerp (0..1)
const SEEK_EPSILON = 0.008; // Minimum time delta (seconds) required to trigger a seek

const HEADLINE = "Milka Boo"; // [YOUR_HEADLINE_HERE]
const SUBHEADING =
  "Creamy fresh milk & handcrafted boba, shaken to order with magic."; // [YOUR_SUBHEADING_HERE]

export default function Hero() {
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const upRef = useRef<HTMLVideoElement>(null);
  const midRef = useRef<HTMLVideoElement>(null);
  const downRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const vUp = upRef.current;
    const vMid = midRef.current;
    const vDown = downRef.current;
    if (!section || !vUp || !vMid || !vDown) return;

    const tracks = [
      { el: vMid, initialized: false, seekQueued: false },
      { el: vUp, initialized: false, seekQueued: false },
      { el: vDown, initialized: false, seekQueued: false },
    ];

    // No autoplay — keep all three videos paused until controlled by mouse movement
    for (const tr of tracks) {
      tr.el.muted = true;
      tr.el.pause();
    }

    // Normalized 2D cursor state inside hero bounding box (0.5, 0.5 = dead center)
    let targetX = 0.5;
    let targetY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let activeRow: "up" | "mid" | "down" = "mid";
    let isVisible = true;
    let rafId = 0;

    const applyActiveRow = (row: "up" | "mid" | "down") => {
      vUp.style.opacity = row === "up" ? "1" : "0";
      vMid.style.opacity = row === "mid" ? "1" : "0";
      vDown.style.opacity = row === "down" ? "1" : "0";
    };
    applyActiveRow("mid");

    const clampTime = (el: HTMLVideoElement, normX: number) => {
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return 0;
      return Math.max(0, Math.min(dur - 0.02, normX * dur));
    };

    // Safe seek per video track: uses native el.seeking + onSeeked queue to prevent seek-flooding
    const flushTrackSeek = (tr: (typeof tracks)[number]) => {
      const { el } = tr;
      if (el.readyState < 2) return;
      const desired = clampTime(el, smoothX);
      if (Math.abs(desired - el.currentTime) <= SEEK_EPSILON) return;

      if (el.seeking) {
        tr.seekQueued = true;
        return;
      }

      tr.seekQueued = false;
      el.currentTime = desired;
    };

    const initTrack = (tr: (typeof tracks)[number]) => {
      const { el } = tr;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      el.pause();
      if (!tr.initialized && el.readyState >= 2) {
        tr.initialized = true;
        el.currentTime = clampTime(el, smoothX);
      }
    };

    // Attach metadata, data, and seeked listeners for each of the 3 directional tracks
    const cleanups: (() => void)[] = [];
    for (const tr of tracks) {
      const onInit = () => initTrack(tr);
      const onSeeked = () => {
        if (tr.seekQueued) {
          tr.seekQueued = false;
          flushTrackSeek(tr);
        } else {
          flushTrackSeek(tr);
        }
      };
      tr.el.addEventListener("loadedmetadata", onInit);
      tr.el.addEventListener("loadeddata", onInit);
      tr.el.addEventListener("seeked", onSeeked);
      if (tr.el.readyState >= 2) initTrack(tr);

      cleanups.push(() => {
        tr.el.removeEventListener("loadedmetadata", onInit);
        tr.el.removeEventListener("loadeddata", onInit);
        tr.el.removeEventListener("seeked", onSeeked);
      });
    }

    // Scoped strictly to the hero section's bounding box:
    // X maps 0..1 -> Left..Center..Right (video.currentTime)
    // Y maps 0..1 -> Up..Level..Down (crossfades UP / MID / DOWN tracks)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      targetY = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    };

    // Gently glide gaze back to center when cursor leaves the hero bounding box
    const handleMouseLeave = () => {
      targetX = 0.5;
      targetY = 0.5;
    };

    // Pause rAF loop while hero is scrolled off-screen so page scrolling stays silky smooth
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(section);

    // Smooth 2D lerp loop via requestAnimationFrame
    const tick = () => {
      if (isVisible) {
        const dx = targetX - smoothX;
        const dy = targetY - smoothY;

        if (Math.abs(dx) > 0.0004) smoothX += dx * LERP_FACTOR;
        else smoothX = targetX;

        if (Math.abs(dy) > 0.0004) smoothY += dy * LERP_FACTOR;
        else smoothY = targetY;

        // Crisp single-row selection with subtle hysteresis (ZERO double-head ghosting!)
        let nextRow: "up" | "mid" | "down" = activeRow;
        if (activeRow === "up") {
          if (smoothY > 0.37) nextRow = smoothY > 0.67 ? "down" : "mid";
        } else if (activeRow === "down") {
          if (smoothY < 0.63) nextRow = smoothY < 0.33 ? "up" : "mid";
        } else {
          if (smoothY < 0.33) nextRow = "up";
          else if (smoothY > 0.67) nextRow = "down";
        }

        if (nextRow !== activeRow) {
          activeRow = nextRow;
          applyActiveRow(activeRow);
        }

        // Keep horizontal currentTime smoothly scrubbed across all tracks in lockstep
        for (const tr of tracks) {
          if (!tr.initialized && tr.el.readyState >= 2) initTrack(tr);
          flushTrackSeek(tr);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    section.addEventListener("mouseleave", handleMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector<HTMLElement>(id);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.5 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Milka Boo Hero"
      className="relative w-full min-h-[100svh] flex flex-col justify-end overflow-hidden bg-[#241a33] select-none"
    >
      {/* 2D Mouse-Scrubbed Video Stack (no autoplay, object-fit: cover, all-keyframe MP4s) */}
      {/* Base layer: LEVEL (Left <-> Center <-> Right) */}
      <video
        ref={midRef}
        src={VIDEOS.mid}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      {/* Upper gaze layer: UP (Top-Left <-> Up-Center <-> Top-Right) */}
      <video
        ref={upRef}
        src={VIDEOS.up}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none will-change-[opacity]"
      />
      {/* Lower gaze layer: DOWN (Bottom-Left <-> Down-Center <-> Bottom-Right) */}
      <video
        ref={downRef}
        src={VIDEOS.down}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none will-change-[opacity]"
      />

      {/* Subtle dark gradient overlay so foreground copy stays readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 12, 34, 0.25) 0%, rgba(20, 12, 34, 0.06) 42%, rgba(20, 12, 34, 0.62) 100%)",
        }}
      />

      {/* Foreground text layer (left-aligned along the lower edge so the cow & cart remain clear) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-10 sm:pb-14 pt-[var(--header-h)] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="font-bherisi text-5xl sm:text-7xl leading-[0.95] text-white drop-shadow-[0_4px_18px_rgba(20,12,34,0.6)]">
            {HEADLINE}
          </h1>
          <p className="mt-3 font-['Lato',sans-serif] text-base sm:text-lg font-medium text-white/90 drop-shadow-[0_2px_10px_rgba(20,12,34,0.75)]">
            {SUBHEADING}
          </p>
        </div>

        {/* Scroll cue into the video journey below */}
        <a
          href="#journey"
          onClick={scrollTo("#journey")}
          style={{ color: "#ffffff" }}
          className="group inline-flex items-center gap-2 self-start sm:self-end font-['Lato',sans-serif] text-xs font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-opacity hover:opacity-100 opacity-95"
          aria-label="Scroll down to begin the journey"
        >
          <span>Scroll to begin the journey</span>
          <span className="inline-block animate-bounce rounded-full bg-black/30 p-1.5 backdrop-blur-sm group-hover:bg-black/50">
            <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
