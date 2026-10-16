"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const SOURCE_SECONDS = 8;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      if (!section || !video) return;

      /* Full 1080p for landscape screens. Portrait screens only ever show the middle of the frame,
         so they get a centred 1080x1080 crop at the same sharpness for less data.
         Both files carry a keyframe every 8 frames so seeking stays quick. */
      const portrait = matchMedia("(max-aspect-ratio: 1/1)");
      const pickSource = () => {
        const src = portrait.matches ? "/video/hero-scrub-portrait.mp4" : "/video/hero-scrub.mp4";
        if (video.getAttribute("src") === src) return;
        video.src = src;
        video.load();
      };
      video.muted = true;
      pickSource();
      portrait.addEventListener("change", pickSource);

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

      const media = section.querySelector<HTMLElement>(".hero__media");

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
        portrait.removeEventListener("change", pickSource);
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
