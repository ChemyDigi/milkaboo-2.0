"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/SmoothScroll";

/* ============================================================================
 * CONFIGURATION — Synchronized 2D Video Tracks (all-keyframe 1080p MP4s)
 * ========================================================================== */
const VIDEOS = {
  // Continuous left-to-right gaze sweep: 0.0s (Far Left / About Us) -> 1.28s (Center) -> 2.24s (Far Right / Menu)
  mid: "/video/cow-hero-mid.mp4",
  // Looking UP towards the sky/awning: 0.0s (Center) -> 1.18s (High Up)
  up: "/video/cow-hero-up.mp4",
  // Continuous down sweep: 0.0s (Down-Left) -> 1.04s (Down-Center / drinks) -> 2.08s (Down-Right)
  down: "/video/cow-hero-down.mp4",
} as const;

const LERP_FACTOR = 0.22; // Responsive, buttery smooth lerp (0..1)
const SEEK_EPSILON = 0.015; // Minimum time delta (seconds) required to trigger seek

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

    // Base track (vMid) is ALWAYS 100% opaque, preventing ANY dark background bleed/flashing.
    // vUp and vDown layer directly on top with smooth cross-fade.
    const applyActiveRow = (row: "up" | "mid" | "down") => {
      vUp.style.opacity = row === "up" ? "1" : "0";
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
      if ("fastSeek" in el) {
        try {
          (el as unknown as { fastSeek: (t: number) => void }).fastSeek(target);
        } catch {
          el.currentTime = target;
        }
      } else {
        el.currentTime = target;
      }
    };

    const initTrack = (tr: (typeof tracks)[number]) => {
      const { el } = tr;
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      el.pause();
      if (!tr.initialized && el.readyState >= 2) {
        tr.initialized = true;
        if (el === vMid) {
          requestSeek(tr, 1.28); // center smiling pose
        } else if (el === vDown) {
          requestSeek(tr, 1.04); // center down pose
        } else {
          requestSeek(tr, 0); // center level pose
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

    // Viewport-wide cursor tracking (never clips or drops near screen edges)
    const handleMouseMove = (e: MouseEvent) => {
      targetX = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      targetY = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      targetX = Math.max(0, Math.min(1, touch.clientX / window.innerWidth));
      targetY = Math.max(0, Math.min(1, touch.clientY / window.innerHeight));
    };

      // Gently return gaze to center only when cursor actually leaves browser window
      const handleMouseLeave = (e: MouseEvent) => {
        if (!e.relatedTarget && !(e as unknown as { toElement?: Element }).toElement) {
          targetX = 0.5;
          targetY = 0.5;
        }
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

              // 2D Spatial Selection with Hysteresis:
              // - "down": lower region (smoothY > 0.56, exit < 0.48).
              //           Sweeps horizontally: Down-Left (0.0) -> Down-Center (0.5) -> Down-Right (1.0).
              // - "up":   top-center region (smoothY < 0.36 && smoothX between 0.22 and 0.78, exit > 0.44).
              //           Tilts up towards the "Milka Boo" awning.
              // - "mid":  eye-level gaze across Left, Center, Right, and flanks.
              let nextRow: "up" | "mid" | "down" = activeRow;
              if (activeRow === "down") {
                if (smoothY < 0.48) {
                  nextRow = smoothY < 0.36 && smoothX >= 0.22 && smoothX <= 0.78 ? "up" : "mid";
                }
              } else if (activeRow === "up") {
                if (smoothY > 0.44 || smoothX < 0.18 || smoothX > 0.82) {
                  nextRow = smoothY > 0.56 ? "down" : "mid";
                }
              } else {
                if (smoothY > 0.56) {
                  nextRow = "down";
                } else if (smoothY < 0.36 && smoothX >= 0.22 && smoothX <= 0.78) {
                  nextRow = "up";
                }
              }

              if (nextRow !== activeRow) {
                activeRow = nextRow;
                applyActiveRow(activeRow);
              }

              // Horizontal target times:
              const midCenter = 1.28;
              const midTargetTime =
                smoothX < 0.5
                  ? (smoothX / 0.5) * midCenter
                  : midCenter + ((smoothX - 0.5) / 0.5) * (vMid.duration - midCenter);

              const downCenter = 1.04;
              const downTargetTime =
                smoothX < 0.5
                  ? (smoothX / 0.5) * downCenter
                  : downCenter + ((smoothX - 0.5) / 0.5) * (vDown.duration - downCenter);

                // Seek active row without saturating decoders (never seek all 3 at once)
                if (activeRow === "down") {
                  if (Number.isFinite(vDown.duration) && vDown.duration > 0) {
                    requestSeek(tracks[2], downTargetTime);
                  }
                  if (Number.isFinite(vMid.duration) && vMid.duration > 0) {
                    requestSeek(tracks[0], midTargetTime);
                  }
                } else if (activeRow === "up") {
                  if (Number.isFinite(vUp.duration) && vUp.duration > 0) {
                    const upFactor = Math.max(0, Math.min(1, (0.36 - smoothY) / 0.36));
                    requestSeek(tracks[1], upFactor * vUp.duration);
                  }
                  if (Number.isFinite(vMid.duration) && vMid.duration > 0) {
                    requestSeek(tracks[0], midTargetTime);
                  }
                } else {
                  if (Number.isFinite(vMid.duration) && vMid.duration > 0) {
                    requestSeek(tracks[0], midTargetTime);
                  }
                }
              }

              rafId = requestAnimationFrame(tick);
            };

            window.addEventListener("mousemove", handleMouseMove, { passive: true });
            window.addEventListener("touchmove", handleTouchMove, { passive: true });
            document.addEventListener("mouseleave", handleMouseLeave);
            rafId = requestAnimationFrame(tick);

            return () => {
              cancelAnimationFrame(rafId);
              io.disconnect();
              window.removeEventListener("mousemove", handleMouseMove);
              window.removeEventListener("touchmove", handleTouchMove);
              document.removeEventListener("mouseleave", handleMouseLeave);
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
      {/* Permanent Solid Base Level Track (ALWAYS 100% OPAQUE - ZERO DARK FLASHES) */}
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

      {/* Upward Gaze Track (Tilts Up towards Awning/Sky) */}
      <video
        ref={upRef}
        src={VIDEOS.up}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-150 ease-out will-change-[opacity]"
      />

      {/* Downward Gaze Track: Down-Left (0.0s) -> Down-Center (1.04s) -> Down-Right (2.08s) */}
      <video
        ref={downRef}
        src={VIDEOS.down}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        style={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-150 ease-out will-change-[opacity]"
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
