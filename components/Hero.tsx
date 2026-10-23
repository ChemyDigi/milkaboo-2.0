"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const SOURCE_SECONDS = 53;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      if (!section || !video) return;

      video.muted = true;

      /* iOS needs one play() behind a gesture before currentTime can be set freely */
      let primed = false;
      const prime = () => {
        if (primed) return;
        primed = true;
        video
          .play()
          .then(() => video.pause())
          .catch(() => {});
      };
      const primeEvents = ["touchstart", "pointerdown", "wheel", "keydown"] as const;
      primeEvents.forEach((e) => window.addEventListener(e, prime, { once: true, passive: true }));

      let target = 0;
      let current = 0;
      const tick = () => {
        if (video.readyState < 1 || video.seeking) return;
        current += (target - current) * 0.16;
        if (Math.abs(current - video.currentTime) > 0.012) video.currentTime = current;
      };
      gsap.ticker.add(tick);

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          noPref: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { reduce } = ctx.conditions as { reduce: boolean };
          gsap.set(video, { scale: 1, x: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=350%",
              pin: true,
              scrub: reduce ? true : 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              target = tl.progress() * (video.duration || SOURCE_SECONDS);
            },
          });

          tl.set({}, {}, 100);
        },
      );

      return () => {
        gsap.ticker.remove(tick);
        primeEvents.forEach((e) => window.removeEventListener(e, prime));
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero" id="top" aria-label="Milka Boo">
      <div className="hero__media">
        <video
          ref={videoRef}
          className="hero__video"
          src="/video/HeroVideo.mp4"
          width={1920}
          height={1080}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </section>
  );
}
