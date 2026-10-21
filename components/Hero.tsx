"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";

const SOURCE_SECONDS = 53.08;

/* The story moments over the scrubbed film, placed in timeline percent (0-100).
   `in`/`out` are the fade windows, `at` is where the scroll settles between them.
   Scenes: the well & the pour -> the dive down the well -> the hidden milk-river
   world (bridge and milk wheels) -> the orchard -> the rose garden -> the golden
   custard caves -> the blackcurrant grove the film ends on.
   `anim` picks the entrance: "rise" (words out of masks), "zoom" (soft scale and
   fade), "bounce" (words spring in from the side), "fade" (one cinematic fade). */
type Moment = {
  id: string;
  pos: "left" | "bl" | "br" | "center";
  anim: "rise" | "zoom" | "bounce" | "fade";
  feature?: boolean;
  /** heading and chapter-dot colour, picked from the scene; the ink plum when unset */
  tint?: string;
  /** a glowing underline flourish drawn beneath the heading */
  underline?: boolean;
  /** a small shimmering spark beside the heading */
  spark?: boolean;
  /** reveal the supporting line one word at a time */
  bodyWords?: boolean;
  in: number;
  out: number | null;
  at: number;
  heading: string;
  body?: string;
};

const MOMENTS: Moment[] = [
  {
    id: "story",
    pos: "left",
    anim: "rise",
    in: 2,
    out: 16,
    at: 8,
    heading: "Every Sip Has a Story.",
    body: "And ours begins with a little magic.",
  },
  {
    id: "wonder",
    pos: "center",
    anim: "zoom",
    in: 17.5,
    out: 22.5,
    at: 19.5,
    heading: "Wonder Where It Goes?",
  },
  {
    id: "world",
    pos: "bl",
    anim: "rise",
    in: 23.5,
    out: 39,
    at: 27.5,
    heading: "Welcome to the World of MilkaBoo.",
    body: "Where imagination flows with every drop.",
  },
  {
    id: "fruity",
    pos: "bl",
    anim: "bounce",
    feature: true,
    tint: "#1c6f2f",
    in: 43,
    out: 52.5,
    at: 46.2,
    heading: "A Little Fruity Wonder.",
  },
  {
    id: "bloom",
    pos: "br",
    anim: "rise",
    feature: true,
    tint: "#b02a5c",
    underline: true,
    in: 55.5,
    out: 65,
    at: 59.3,
    heading: "Let the Magic Bloom.",
    body: "A touch of floral wonder in every journey.",
  },
  {
    id: "dreams",
    pos: "left",
    anim: "zoom",
    feature: true,
    tint: "#9a5a00",
    spark: true,
    bodyWords: true,
    in: 68,
    out: 79.5,
    at: 73.5,
    heading: "Sweet Dreams Are Made Here.",
    body: "Smooth. Creamy. Simply magical.",
  },
  {
    id: "more",
    pos: "br",
    anim: "fade",
    tint: "#55307f",
    in: 89.5,
    out: null,
    at: 96,
    heading: "And the Magic Doesn't Stop Here…",
    body: "There's so much more to discover.",
  },
];

/* Where the scroll may rest inside the pin: each moment, both ends, and one
   text-free stop at the milk wheels so the artwork gets a scene to itself. */
const SNAPS = [0, ...MOMENTS.map((m) => m.at), 35.5, 100].sort((a, b) => a - b);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  /* while a programmatic glide runs, the snap-on-scroll-end handler stands down */
  const glideUntil = useRef(0);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  /* the chapter rail: jump the scroll to a moment's resting point */
  const goTo = (at: number) => {
    const st = stRef.current;
    const smooth = lenisRef.current;
    if (!st || !smooth) return;
    glideUntil.current = Date.now() + 1500;
    smooth.scrollTo(st.start + (at / 100) * (st.end - st.start), { duration: 1.2 });
  };

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
          const dots = section.querySelectorAll<HTMLElement>(".hero__rail__dot");

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=1100%",
              pin: true,
              scrub: reduce ? true : 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              /* stay a hair short of the end so the last decoded frame is always clean */
              const dur = video.duration || SOURCE_SECONDS;
              const p = tl.progress() * 100;
              target = Math.min((p / 100) * dur, dur - 0.1);
              /* light the chapter dots up to the moment the story has reached */
              let now = -1;
              MOMENTS.forEach((m, i) => {
                const on = p >= m.in;
                dots[i]?.classList.toggle("is-on", on);
                if (on) now = i;
              });
              dots.forEach((d, i) => d.classList.toggle("is-now", i === now));
            },
          });

          /* the "scroll" hint leaves as soon as the story starts */
          tl.to(".hero__hint__inner", { autoAlpha: 0, duration: 3 }, 1);

          /* each moment gets its own entrance, timed to be fully settled at its
             snap point, and a shared gentle exit */
          MOMENTS.forEach((m) => {
            const inner = section.querySelector<HTMLElement>(`[data-copy="${m.id}"] .hero__copy__inner`);
            if (!inner) return;
            /* everything must be settled by the snap point, however tight the window */
            const budget = m.at - m.in - 0.2;

            if (reduce) {
              tl.set(Array.from(inner.children), { autoAlpha: 1 }, m.in);
              tl.fromTo(inner, { autoAlpha: 0 }, { autoAlpha: 1, duration: budget, ease: "none" }, m.in);
            } else {
              const heading = inner.querySelector(".hero__heading");
              const words = inner.querySelectorAll(".hero__word");
              const body = inner.querySelector(".hero__body");
              const bodyWords = inner.querySelectorAll(".hero__bword");
              const flourish = inner.querySelector(".hero__flourish");

              switch (m.anim) {
                case "rise": {
                  /* words cascade up out of their masks */
                  tl.set(inner, { autoAlpha: 1 }, m.in);
                  tl.set(heading, { autoAlpha: 1 }, m.in);
                  tl.fromTo(
                    words,
                    { yPercent: 118, rotate: 5 },
                    {
                      yPercent: 0,
                      rotate: 0,
                      duration: budget * 0.55,
                      stagger: words.length > 1 ? (budget * 0.45) / (words.length - 1) : 0,
                      ease: "power3.out",
                      transformOrigin: "0% 100%",
                    },
                    m.in + 0.2,
                  );
                  if (body) {
                    tl.fromTo(
                      body,
                      { autoAlpha: 0, y: 26 },
                      { autoAlpha: 1, y: 0, duration: budget * 0.6, ease: "power2.out" },
                      m.in + budget * 0.4,
                    );
                  }
                  break;
                }
                case "bounce": {
                  /* words spring in from the side, playful but controlled */
                  tl.set(inner, { autoAlpha: 1 }, m.in);
                  tl.set(heading, { autoAlpha: 1 }, m.in);
                  tl.fromTo(
                    words,
                    { x: -44, autoAlpha: 0 },
                    {
                      x: 0,
                      autoAlpha: 1,
                      duration: budget * 0.5,
                      stagger: words.length > 1 ? (budget * 0.5) / (words.length - 1) : 0,
                      ease: "back.out(1.6)",
                    },
                    m.in + 0.2,
                  );
                  break;
                }
                case "zoom": {
                  /* one slow, elegant scale-and-fade reveal of the whole block */
                  tl.fromTo(
                    inner,
                    { autoAlpha: 0, scale: 0.94 },
                    {
                      autoAlpha: 1,
                      scale: 1,
                      duration: budget,
                      ease: "power2.out",
                      transformOrigin: m.pos === "center" ? "50% 50%" : "0% 50%",
                    },
                    m.in,
                  );
                  /* a whisper of growth while the block holds, synced to the descent */
                  if (m.out !== null) {
                    tl.to(inner, { scale: 1.04, duration: m.out - 3 - m.at, ease: "none" }, m.at);
                  }
                  if (bodyWords.length) {
                    tl.fromTo(
                      bodyWords,
                      { autoAlpha: 0, y: 14 },
                      {
                        autoAlpha: 1,
                        y: 0,
                        duration: budget * 0.3,
                        stagger: bodyWords.length > 1 ? (budget * 0.4) / (bodyWords.length - 1) : 0,
                        ease: "power2.out",
                      },
                      m.in + budget * 0.45,
                    );
                  }
                  break;
                }
                case "fade": {
                  /* the cinematic closer: one long, quiet fade */
                  tl.fromTo(
                    inner,
                    { autoAlpha: 0, y: 24 },
                    { autoAlpha: 1, y: 0, duration: budget, ease: "power1.inOut" },
                    m.in,
                  );
                  break;
                }
              }

              if (flourish) {
                tl.fromTo(
                  flourish,
                  { scaleX: 0, autoAlpha: 0 },
                  {
                    scaleX: 1,
                    autoAlpha: 1,
                    duration: budget * 0.45,
                    ease: "power2.out",
                    transformOrigin: m.pos === "br" ? "100% 50%" : "0% 50%",
                  },
                  m.in + budget * 0.55,
                );
              }
            }

            if (m.out !== null) {
              tl.to(inner, { autoAlpha: 0, y: reduce ? 0 : -40, duration: 3, ease: "power1.in" }, m.out - 3);
            }
          });

          tl.set({}, {}, 100);

          /* scroll locks: when scrolling rests inside the pin, settle on the nearest moment */
          const st = tl.scrollTrigger;
          stRef.current = st ?? null;
          const onScrollEnd = () => {
            const smooth = lenisRef.current;
            if (!smooth || !st) return;
            /* a dropped frame can fire scrollEnd while Lenis is still easing;
               snapping then would yank the page back to the previous stop */
            if (smooth.isScrolling) return;
            if (Date.now() < glideUntil.current) return;
            const y = st.scroll();
            if (y <= st.start + 2 || y >= st.end - 2) return;
            const p = ((y - st.start) / (st.end - st.start)) * 100;
            let best = SNAPS[0];
            for (const s of SNAPS) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
            const targetY = st.start + (best / 100) * (st.end - st.start);
            if (Math.abs(targetY - y) < 2) return;
            glideUntil.current = Date.now() + 1100;
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
          className={`hero__copy hero__copy--${m.pos}${m.feature ? " hero__copy--feature" : ""}`}
          data-copy={m.id}
          data-anim={m.anim}
          style={m.tint ? ({ "--copy-tint": m.tint } as CSSProperties) : undefined}
        >
          <div className="hero__copy__inner">
            <h2 className="hero__heading">
              {m.spark && (
                <span className="hero__spark" aria-hidden="true">
                  ✦{" "}
                </span>
              )}
              {m.anim === "rise" || m.anim === "bounce"
                ? m.heading.split(" ").map((word, i) => (
                    <span key={i}>
                      {i > 0 && " "}
                      {m.anim === "rise" ? (
                        <span className="hero__mask">
                          <span className="hero__word">{word}</span>
                        </span>
                      ) : (
                        <span className="hero__word">{word}</span>
                      )}
                    </span>
                  ))
                : m.heading}
            </h2>
            {m.underline && <span className="hero__flourish" aria-hidden="true" />}
            {m.body && (
              <p className="hero__body">
                {m.bodyWords
                  ? m.body.split(" ").map((word, i) => (
                      <span key={i}>
                        {i > 0 && " "}
                        <span className="hero__bword">{word}</span>
                      </span>
                    ))
                  : m.body}
              </p>
            )}
          </div>
        </div>
      ))}

      <div className="hero__hint" aria-hidden="true">
        <div className="hero__hint__inner">
          <span>scroll</span>
          <span className="hero__hint__line" />
        </div>
      </div>

      <nav className="hero__rail" aria-label="Story chapters">
        {MOMENTS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="hero__rail__dot"
            style={m.tint ? ({ "--dot-tint": m.tint } as CSSProperties) : undefined}
            aria-label={m.heading}
            onClick={() => goTo(m.at)}
          />
        ))}
      </nav>
    </section>
  );
}
