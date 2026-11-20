"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/SmoothScroll";

/* ============================================================================
 * CONFIGURATION — swap video source or copy here
 * ========================================================================== */
// Fast all-keyframe 1080p MP4 generated directly from Home_Page_Video.mp4
// for instantaneous, lag-free 60fps mouse-scrubbing.
const VIDEO_SRC = "/video/hero-cow.mp4"; 

const LERP_FACTOR = 0.12; // Smoothness for requestAnimationFrame lerp (0..1)
const SEEK_EPSILON = 0.01; // Minimum time delta (seconds) required to trigger seek

const HEADLINE = "Milka Boo"; // [YOUR_HEADLINE_HERE]
const SUBHEADING =
  "Creamy fresh milk & handcrafted boba, shaken to order with magic."; // [YOUR_SUBHEADING_HERE]

export default function Hero() {
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    // No autoplay — keep video paused until controlled by mouse movement
    video.muted = true;
    video.pause();

    let isSeeking = false;
    let queuedTime: number | null = null;
    let targetTime = 0;
    let smoothTime = 0;
    let isInitialized = false;
    let isVisible = true;
    let rafId = 0;

    const clampTime = (t: number) => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return 0;
      return Math.max(0, Math.min(dur - 0.02, t));
    };

    // Safe seek mechanism: prevents seek-flooding using video.seeking & onSeeked queue
    const requestSeek = (time: number) => {
      if (video.readyState < 2) return;
      const desired = clampTime(time);
      if (Math.abs(desired - video.currentTime) <= SEEK_EPSILON) return;

      if (video.seeking || isSeeking) {
        queuedTime = desired;
        return;
      }

      isSeeking = true;
      queuedTime = null;
      video.currentTime = desired;
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (queuedTime !== null) {
        const nextTime = queuedTime;
        queuedTime = null;
        requestSeek(nextTime);
      }
    };

    const handleVideoReady = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.pause();
      if (!isInitialized && video.readyState >= 2) {
        isInitialized = true;
        // Start near center of the video
        targetTime = video.duration * 0.5;
        smoothTime = targetTime;
        requestSeek(smoothTime);
      }
    };

    // Scoped strictly to the hero section's bounding box:
    // Mouse at far left = start (frame 0)
    // Mouse at far right = end (last frame)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        targetTime = normX * dur;
      }
    };

    // Touch support: drag across hero banner to scrub
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = section.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / Math.max(1, rect.width)));
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        targetTime = normX * dur;
      }
    };

    // Gently glide back toward center when cursor leaves hero section
    const handleMouseLeave = () => {
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        targetTime = dur * 0.5;
      }
    };

    // IntersectionObserver pauses rAF when hero is scrolled out of viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(section);

    // Smooth lerp loop via requestAnimationFrame
    const tick = () => {
      if (isVisible && isInitialized) {
        const dt = targetTime - smoothTime;
        if (Math.abs(dt) > 0.005) {
          smoothTime += dt * LERP_FACTOR;
        } else {
          smoothTime = targetTime;
        }
        requestSeek(smoothTime);
      }
      rafId = requestAnimationFrame(tick);
    };

    video.addEventListener("loadedmetadata", handleVideoReady);
    video.addEventListener("loadeddata", handleVideoReady);
    video.addEventListener("canplay", handleVideoReady);
    video.addEventListener("seeked", handleSeeked);

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    section.addEventListener("touchmove", handleTouchMove, { passive: true });
    section.addEventListener("mouseleave", handleMouseLeave);

    if (video.readyState >= 2) {
      handleVideoReady();
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      video.removeEventListener("loadedmetadata", handleVideoReady);
      video.removeEventListener("loadeddata", handleVideoReady);
      video.removeEventListener("canplay", handleVideoReady);
      video.removeEventListener("seeked", handleSeeked);
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("touchmove", handleTouchMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
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
      {/* Mouse-Scrubbed Background Video (no autoplay, object-fit: cover, all-keyframe 1080p MP4) */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
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
