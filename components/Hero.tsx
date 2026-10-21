"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";

const SOURCE_SECONDS = 28.86;

/* The copy moments over the scrubbed video, placed in timeline percent (0-100).
   `in`/`out` are the fade windows, `at` is where the scroll settles between them.
   The percents map onto the film: meadow & well -> pouring -> the dive down the
   well (left clear as a breather) -> the milk river world -> the milk wheels ->
   the green-apple orchard that the film ends on. */
type Moment = {
  id: string;
  pos: "left" | "bl" | "br";
  theme?: "apple";
  in: number;
  out: number | null;
  at: number;
  eyebrow: string;
  heading: string;
  body: string;
};

const MOMENTS: Moment[] = [
  {
    id: "well",
    pos: "left",
    in: 3,
    out: 16,
    at: 10,
    eyebrow: "fresh from the meadow",
    heading: "Every drop starts at the well.",
    body: "Meet Milka Boo, a little cow with a big secret hiding under the meadow.",
  },
  {
    id: "pour",
    pos: "left",
    in: 17,
    out: 30,
    at: 23.5,
    eyebrow: "poured with love",
    heading: "Real milk. Nothing less.",
    body: "Whole, fresh and creamy, poured straight down the magic well.",
  },
  {
    id: "river",
    pos: "bl",
    in: 39,
    out: 56,
    at: 47,
    eyebrow: "deep below the meadow",
    heading: "A river of milk runs through it.",
    body: "Welcome to the Milkaboo world, where every flavour begins its journey.",
  },
  {
    id: "craft",
    pos: "br",
    in: 59,
    out: 76,
    at: 67,
    eyebrow: "crafted with care",
    heading: "Tended by the tiniest hands.",
    body: "Our little crew turns the milk wheels so every sip comes out just right.",
  },
  {
    id: "apple",
    pos: "left",
    theme: "apple",
    in: 84,
    out: null,
    at: 92,
    eyebrow: "something crisp is coming",
    heading: "Green Apple Milkaboo.",
    body: "Fresh-picked green apples, swirled into creamy milk. And that's only half the story…",
  },
];

/* Where the scroll is allowed to rest inside the pin: each copy moment, plus both ends. */
const SNAPS = [0, ...MOMENTS.map((m) => m.at), 100];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      if (!section || !video) return;

      video.muted = true;
      /* re-encode of Sample.mp4: keyframe every 8 frames so scrubbing seeks instantly, audio stripped */
      video.src = "/video/sample-scrub.mp4";
      video.load();

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
              end: "+=600%",
              pin: true,
              scrub: reduce ? true : 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              /* the film's very last frames fade to black; rest on the orchard instead */
              const dur = video.duration || SOURCE_SECONDS;
              target = Math.min(tl.progress() * dur, dur - 0.3);
            },
          });

          /* the "scroll" hint leaves as soon as the story starts */
          tl.to(".hero__hint__inner", { autoAlpha: 0, duration: 3 }, 1);

          /* each copy moment rises in, holds around its snap point, and gives way */
          MOMENTS.forEach((m) => {
            const inner = section.querySelector(`[data-copy="${m.id}"] .hero__copy__inner`);
            if (!inner) return;
            tl.fromTo(
              inner.children,
              { autoAlpha: 0, y: reduce ? 0 : 56 },
              { autoAlpha: 1, y: 0, duration: 4, stagger: 0.8, ease: "power2.out" },
              m.in,
            );
            if (m.out !== null) {
              tl.to(inner, { autoAlpha: 0, y: reduce ? 0 : -40, duration: 3, ease: "power1.in" }, m.out - 3);
            }
          });

          tl.set({}, {}, 100);

          /* scroll locks: when scrolling rests inside the pin, settle on the nearest moment */
          const st = tl.scrollTrigger;
          const onScrollEnd = () => {
            const smooth = lenisRef.current;
            if (!smooth || !st) return;
            const y = st.scroll();
            if (y <= st.start + 2 || y >= st.end - 2) return;
            const p = ((y - st.start) / (st.end - st.start)) * 100;
            let best = SNAPS[0];
            for (const s of SNAPS) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
            const targetY = st.start + (best / 100) * (st.end - st.start);
            if (Math.abs(targetY - y) < 2) return;
            smooth.scrollTo(targetY, { duration: reduce ? 0.45 : 0.9 });
          };
          ScrollTrigger.addEventListener("scrollEnd", onScrollEnd);

          return () => {
            ScrollTrigger.removeEventListener("scrollEnd", onScrollEnd);
          };
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
          width={1920}
          height={1080}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {MOMENTS.map((m) => (
        <div
          key={m.id}
          className={`hero__copy hero__copy--${m.pos}${m.theme ? ` hero__copy--${m.theme}` : ""}`}
          data-copy={m.id}
        >
          <div className="hero__copy__inner">
            <p className="hero__eyebrow">{m.eyebrow}</p>
            <h2 className="hero__heading">{m.heading}</h2>
            <p className="hero__body">{m.body}</p>
          </div>
        </div>
      ))}

      <div className="hero__hint" aria-hidden="true">
        <div className="hero__hint__inner">
          <span>scroll</span>
          <span className="hero__hint__line" />
        </div>
      </div>
    </section>
  );
}
