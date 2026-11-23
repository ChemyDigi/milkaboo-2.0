"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/SmoothScroll";

/* ============================================================================
 * CONFIGURATION — Synchronized 2D Video Tracks (all-keyframe 1080p MP4s)
 * ========================================================================== */
const VIDEOS = {
  // Continuous left-to-right gaze sweep: 0.0s (Far Left) -> 1.4s (Center) -> 2.55s (Far Right)
  mid: "/video/cow-hero-mid.mp4",
  // Looking UP towards the sky/awning: 0.0s (Center) -> 1.6s (High Up)
  up: "/video/cow-hero-up.mp4",
  // Looking DOWN towards the boba cups: 0.0s (Center) -> 1.2s (Down)
  down: "/video/cow-hero-down.mp4",
} as const;

const LERP_FACTOR = 0.14; // Smoothness for requestAnimationFrame lerp (0..1)
const SEEK_EPSILON = 0.01; // Minimum time delta (seconds) required to trigger seek

const HEADLINE = "Milka Boo";
const SUBHEADING =
  "Creamy fresh milk & handcrafted boba, shaken to order with magic.";

export default function Hero() {
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const midRef = useRef<HTMLVideoElement>(null);
  const upRef = useRef<HTMLVideoElement>(null);
  const downRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const vMid = midRef.current;
    const vUp = upRef.current;
    const vDown = downRef.current;
    if (!section || !vMid || !vUp || !vDown) return;

    const tracks = [
      { el: vMid, initialized: false, isSeeking: false, queuedTime: null as number | null },
      { el: vUp, initialized: false, isSeeking: false, queuedTime: null as number | null },
      { el: vDown, initialized: false, isSeeking: false, queuedTime: null as number | null },
    ];

    // No autoplay — keep all video tracks paused
    for (const tr of tracks) {
      tr.el.muted = true;
      tr.el.pause();
    }

    // Normalized cursor state inside hero bounding box (0.5, 0.5 = dead center)
    let targetX = 0.5;
    let targetY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let activeRow: "up" | "mid" | "down" = "mid";
    let isVisible = true;
    let rafId = 0;

    // Discrete track visibility with zero ghosting
    const applyActiveRow = (row: "up" | "mid" | "down") => {
      vUp.style.opacity = row === "up" ? "1" : "0";
      vMid.style.opacity = row === "mid" ? "1" : "0";
      vDown.style.opacity = row === "down" ? "1" : "0";
    };
    applyActiveRow("mid");

    const clampTime = (el: HTMLVideoElement, time: number) => {
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return 0;
      return Math.max(0, Math.min(dur - 0.02, time));
    };

    const requestSeek = (tr: (typeof tracks)[number], desiredTime: number) => {
      const { el } = tr;
      if (el.readyState < 2) return;
      const target = clampTime(el, desiredTime);
      if (Math.abs(target - el.currentTime) <= SEEK_EPSILON) return;

      if (el.seeking || tr.isSeeking) {
        tr.queuedTime = target;
        return;
      }

      tr.isSeeking = true;
      tr.queuedTime = null;
      el.currentTime = target;
    };

    const initTrack = (tr: (typeof tracks)[number]) => {
      const { el } = tr;
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      el.pause();
      if (!tr.initialized && el.readyState >= 2) {
        tr.initialized = true;
        if (el === vMid) {
          requestSeek(tr, el.duration * 0.54); // center smiling pose
        } else {
          requestSeek(tr, 0);
        }
      }
    };

    const cleanups: (() => void)[] = [];
    for (const tr of tracks) {
      const onInit = () => initTrack(tr);
      const onSeeked = () => {
        tr.isSeeking = false;
        if (tr.queuedTime !== null) {
          const next = tr.queuedTime;
          tr.queuedTime = null;
          requestSeek(tr, next);
        }
      };
      tr.el.addEventListener("loadedmetadata", onInit);
      tr.el.addEventListener("loadeddata", onInit);
      tr.el.addEventListener("canplay", onInit);
      tr.el.addEventListener("seeked", onSeeked);

      if (tr.el.readyState >= 2) initTrack(tr);

      cleanups.push(() => {
        tr.el.removeEventListener("loadedmetadata", onInit);
        tr.el.removeEventListener("loadeddata", onInit);
        tr.el.removeEventListener("canplay", onInit);
        tr.el.removeEventListener("seeked", onSeeked);
      });
    }

    // Scoped strictly to the hero bounding box:
    // Mouse far left (0) -> cow looks left at mouse
    // Mouse center (0.5) -> cow looks dead center at mouse
    // Mouse far right (1.0) -> cow looks right at mouse
    // Mouse top -> cow looks up
    // Mouse bottom -> cow looks down
    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      targetY = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = section.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / Math.max(1, rect.width)));
      targetY = Math.max(0, Math.min(1, (touch.clientY - rect.top) / Math.max(1, rect.height)));
    };

    // Gently return gaze to center when cursor leaves hero section
    const handleMouseLeave = () => {
      targetX = 0.5;
      targetY = 0.5;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(section);

    // 60fps rAF lerp loop
    const tick = () => {
      if (isVisible) {
        const dx = targetX - smoothX;
        const dy = targetY - smoothY;

        if (Math.abs(dx) > 0.002) smoothX += dx * LERP_FACTOR;
        else smoothX = targetX;

        if (Math.abs(dy) > 0.002) smoothY += dy * LERP_FACTOR;
        else smoothY = targetY;

        // Vertical hysteresis row switching (clean discrete layer selection = ZERO ghosting)
        let nextRow: "up" | "mid" | "down" = activeRow;
        if (activeRow === "up") {
          if (smoothY > 0.40) nextRow = smoothY > 0.65 ? "down" : "mid";
        } else if (activeRow === "down") {
          if (smoothY < 0.60) nextRow = smoothY < 0.35 ? "up" : "mid";
        } else {
          if (smoothY < 0.32) nextRow = "up";
          else if (smoothY > 0.68) nextRow = "down";
        }

        if (nextRow !== activeRow) {
          activeRow = nextRow;
          applyActiveRow(activeRow);
        }

        // 1. MID track: currentTime directly maps to smoothX
        // Left (0) = 0.0s (Far Left), Center (0.5) = 1.38s (Center), Right (1.0) = 2.54s (Far Right)
        if (Number.isFinite(vMid.duration) && vMid.duration > 0) {
          const midTargetTime = smoothX * vMid.duration;
          requestSeek(tracks[0], midTargetTime);
        }

        // 2. UP track: tilts up as cursor moves towards top
        if (Number.isFinite(vUp.duration) && vUp.duration > 0) {
          const upFactor = Math.max(0, Math.min(1, (0.35 - smoothY) / 0.35));
          requestSeek(tracks[1], upFactor * vUp.duration);
        }

        // 3. DOWN track: tilts down as cursor moves towards bottom
        if (Number.isFinite(vDown.duration) && vDown.duration > 0) {
          const downFactor = Math.max(0, Math.min(1, (smoothY - 0.65) / 0.35));
          requestSeek(tracks[2], downFactor * vDown.duration);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    section.addEventListener("touchmove", handleTouchMove, { passive: true });
    section.addEventListener("mouseleave", handleMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("touchmove", handleTouchMove);
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
      {/* 2D Mouse-Scrubbed Video Stack (Level, Up, Down — all-keyframe 1080p MP4s) */}
      {/* Base Level Track: Left (0.0s) -> Center (1.4s) -> Right (2.55s) */}
      <video
        ref={midRef}
        src={VIDEOS.mid}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ imageRendering: "-webkit-optimize-contrast" }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Upward Gaze Track (Tilts Up towards Awning/Sky) */}
      <video
        ref={upRef}
        src={VIDEOS.up}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0, imageRendering: "-webkit-optimize-contrast" }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none will-change-[opacity]"
      />

      {/* Downward Gaze Track (Tilts Down towards Boba Drinks) */}
      <video
        ref={downRef}
        src={VIDEOS.down}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0, imageRendering: "-webkit-optimize-contrast" }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none will-change-[opacity]"
      />

      {/* Subtle bottom vignette overlay to keep foreground text razor-sharp without dulling video colors */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 12, 34, 0.08) 0%, rgba(20, 12, 34, 0) 45%, rgba(20, 12, 34, 0.38) 100%)",
        }}
      />

      {/* Foreground text layer */}
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
