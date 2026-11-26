"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/SmoothScroll";

/* ============================================================================
 * CONFIGURATION — True Left-to-Right Cow Head Movement
 * High-performance 60fps/120fps canvas rendering from Home_Page_Video.mp4
 *
 * 1. Full Horizontal Range:
 *    - Frame 01 (col 0): Far Left — Cow looks directly at "About Us"
 *    - Frame 31 (col 30): Center — Cow smiles directly forward at the viewer
 *    - Frame 61 (col 60): Far Right — Cow looks directly at "Menu"
 * 2. Natural Ambient Sway:
 *    - When idle, head continuously sways left & right like in the video.
 * 3. Smooth Mouse/Touch Scrubbing:
 *    - Moving the mouse smoothly glides the cow's gaze across the stall.
 * ========================================================================== */
const TOTAL_FRAMES = 61;
const CENTER_INDEX = 30; // Frame 31 (0-indexed 30) is dead center smiling

export default function Hero() {
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Cache containers for all 61 frames
    const frames: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);

    // Prioritize loading center smiling pose first (instant poster)
    const poster = new Image();
    poster.src = "/images/hero-frames/frame_31.webp";
    frames[CENTER_INDEX] = poster;

    // Preload remaining frames in parallel
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      if (i === CENTER_INDEX + 1) continue;
      const img = new Image();
      img.src = `/images/hero-frames/frame_${String(i).padStart(2, "0")}.webp`;
      const idx = i - 1;
      img.onload = () => {
        frames[idx] = img;
      };
    }

    // Canvas resize handler (crisp Retina / HiDPI support)
    // Saves current pixel content, resizes, then redraws immediately to prevent black flash
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const newW = Math.round(w * dpr);
      const newH = Math.round(h * dpr);
      if (canvas.width === newW && canvas.height === newH) return;

      // Grab a snapshot of what's currently drawn (may be null before first draw)
      let snapshot: ImageData | null = null;
      try {
        if (canvas.width > 0 && canvas.height > 0) {
          snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
      } catch (_) { /* cross-origin guard, never fires locally */ }

      canvas.width = newW;
      canvas.height = newH;

      // Immediately repaint so there's no single black frame
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
      } else {
        // Before first frame, draw the poster so we never flash black
        const img = frames[CENTER_INDEX] || poster;
        if (img && img.complete && img.naturalWidth > 0) drawCover(img);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // State tracking
    let targetX = 0.5;
    let smoothX = 0.5;
    let isInteracting = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleAngle = 0;
    let isVisible = true;
    let rafId = 0;

    const activateInteraction = (clientX: number) => {
      targetX = Math.max(0, Math.min(1, clientX / window.innerWidth));
      isInteracting = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isInteracting = false;
        // Synchronize idleAngle with current smoothX so there is ZERO jump when resuming idle sway
        const clampedOffset = Math.max(-1, Math.min(1, (smoothX - 0.5) / 0.38));
        idleAngle = Math.asin(clampedOffset);
      }, 1800);
    };

    const handleMouseMove = (e: MouseEvent) => {
      activateInteraction(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      activateInteraction(e.touches[0].clientX);
    };

    const handleMouseLeave = () => {
      if (idleTimer) clearTimeout(idleTimer);
      isInteracting = false;
      const clampedOffset = Math.max(-1, Math.min(1, (smoothX - 0.5) / 0.38));
      idleAngle = Math.asin(clampedOffset);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(section);

    // Fast GPU-accelerated cover draw helper (<0.1ms per frame)
    const drawCover = (img: HTMLImageElement) => {
      if (!img || !img.complete || img.naturalWidth === 0) return false;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.drawImage(img, dx, dy, dw, dh);
      return true;
    };

    // Track ready state without triggering React re-render on every frame
    let hasSetReady = false;

    // 60/120fps Render Loop
    const tick = () => {
      if (isVisible) {
        if (!isInteracting) {
          // Natural left-to-right head sway cycle matching the original video cadence (~6s)
          idleAngle += 0.016;
          targetX = 0.5 + 0.38 * Math.sin(idleAngle);
        }

        // Exponential smoothing: responsive while scrubbing, organic when idle
        const LERP = isInteracting ? 0.12 : 0.07;
        smoothX += (targetX - smoothX) * LERP;

        // Exact frame mapping: 0 (Left: About Us) -> 30 (Center: Smiling) -> 60 (Right: Menu)
        const frameIdx = Math.max(
          0,
          Math.min(TOTAL_FRAMES - 1, Math.round(smoothX * (TOTAL_FRAMES - 1)))
        );

        const imgToDraw = frames[frameIdx] || frames[CENTER_INDEX] || poster;
        if (imgToDraw) {
          const drawn = drawCover(imgToDraw);
          // Only trigger ONE React state update when the first frame successfully draws
          if (drawn && !hasSetReady) {
            hasSetReady = true;
            setIsReady(true);
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
      if (idleTimer) clearTimeout(idleTimer);
      io.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
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
      {/* Fallback / Instant Poster Frame (zero flash of black) */}
      <img
        src="/images/hero-frames/frame_31.webp"
        alt="Milka Boo Cow Stall"
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 ${
          isReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* 60fps Left-to-Right Canvas Gaze (Zero ghosting, Zero lag, Zero black flash) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Scroll cue into the video journey below */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-10 sm:pb-14 flex justify-end">
        <a
          href="#journey"
          onClick={scrollTo("#journey")}
          style={{ color: "#ffffff" }}
          className="group inline-flex items-center gap-2 font-['Lato',sans-serif] text-xs font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-opacity hover:opacity-100 opacity-95"
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
