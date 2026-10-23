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
  /** "bridge": centred across the top, resting just above the bridge in the river scene */
  pos: "left" | "bl" | "br" | "center" | "bridge";
  anim: "rise" | "zoom" | "bounce" | "fade" | "through" | "arc";
  /** let the scroll pass this moment instead of locking onto it */
  noSnap?: boolean;
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
    anim: "through",
    noSnap: true,
    in: 16.5,
    out: 24.5,
    at: 18.5,
    heading: "Wonder Where It Goes?",
  },
  {
    id: "world",
    pos: "bridge",
    anim: "arc",
    in: 24,
    out: 31,
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
/* sparkles in the fly-through burst; their directions follow the golden angle so
   they spread evenly without randomness (server and client render the same) */
const SPARKLES = 16;

/* Magical dust for the fly-through: ~150 glowing motes that stream out from the
   words' centre, accelerating like a warp, swirling with the text and twinkling.
   A pure function of progress p (0-1), so scrolling back replays it backwards. */
const DUST = 150;
function makeDust(canvas: HTMLCanvasElement, centre: () => { x: number; y: number }) {
  const ctx = canvas.getContext("2d");
  let seed = 7;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const tones = ["255, 201, 77", "255, 95, 175", "255, 255, 255", "255, 236, 180"];
  const motes = Array.from({ length: DUST }, () => ({
    angle: rand() * Math.PI * 2,
    r0: rand() * 0.18,
    speed: 0.55 + rand() * 1.1,
    start: rand() * 0.55,
    size: 0.6 + rand() * 1.8,
    tone: Math.floor(rand() * tones.length),
    phase: rand() * Math.PI * 2,
    blink: 10 + rand() * 26,
  }));
  /* one soft glow sprite per tone, drawn once and stamped per mote */
  const sprites = tones.map((rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.18, `rgba(${rgb}, 0.95)`);
    grad.addColorStop(0.5, `rgba(${rgb}, 0.28)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  });
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

  return (p: number) => {
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (p <= 0 || p >= 1) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    const { x: cx, y: cy } = centre();
    const R = Math.max(w, h) * 0.8;
    /* the cloud gathers, swells with the zoom, then thins out past the break-through */
    const envelope = clamp01(p / 0.12) * (1 - clamp01((p - 0.82) / 0.18));
    for (const d of motes) {
      const local = clamp01((p - d.start) / (1 - d.start));
      if (local <= 0) continue;
      const r = (d.r0 + Math.pow(local, 2.2) * d.speed) * R;
      const a = d.angle - local * 0.9;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.82;
      if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
      const twinkle = 0.55 + 0.45 * Math.sin(d.phase + p * d.blink);
      const alpha = envelope * clamp01(local / 0.08) * (1 - Math.pow(local, 3)) * twinkle;
      if (alpha <= 0.01) continue;
      const size = d.size * (5 + local * 26);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprites[d.tone], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };
}

/* The curved heading over the bridge: SVG text on a gentle arch in a 1000x175 box,
   bent like the bridge railing (high in the middle, dipping at both ends). */
const ARC_W = 1000;
const ARC_H = 175;
const ARC_PATH = "M 30 150 Q 500 45 970 150";

const SNAPS = [0, ...MOMENTS.filter((m) => !m.noSnap).map((m) => m.at), 35.5, 100].sort((a, b) => a - b);

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

            const arcMask = inner.querySelector(".hero__arcmask rect");
            const arcText = inner.querySelector<SVGTextElement>(".hero__arctext");
            if (arcText) {
              /* shrink the type until the whole line fits on the arch (web fonts may
                 land late and change the widths, so fit again once they're in) */
              const fit = () => {
                const path = inner.querySelector<SVGPathElement>(".hero__arcpath");
                if (!path) return;
                let size = 78;
                arcText.setAttribute("font-size", String(size));
                const room = path.getTotalLength() * 0.96;
                const len = arcText.getComputedTextLength();
                if (len > room) size *= room / len;
                arcText.setAttribute("font-size", size.toFixed(1));
              };
              fit();
              document.fonts?.ready.then(fit);
            }
            if (reduce) {
              if (arcMask) tl.set(arcMask, { attr: { width: ARC_W * 1.7 } }, 0);
              tl.set(Array.from(inner.children), { autoAlpha: 1 }, m.in);
              tl.fromTo(inner, { autoAlpha: 0 }, { autoAlpha: 1, duration: budget, ease: "none" }, m.in);
            } else {
              const heading = inner.querySelector(".hero__heading");
              const words = inner.querySelectorAll(".hero__word");
              const body = inner.querySelector(".hero__body");
              const bodyWords = inner.querySelectorAll(".hero__bword");
              const flourish = inner.querySelector(".hero__flourish");

              switch (m.anim) {
                case "arc": {
                  /* the curved heading writes itself on along the arch, left to right (the mask runs
                     well past the text so its feathered edge ends clear of the last letter),
                     with a soft leading edge, then the line below settles in */
                  tl.set(inner, { autoAlpha: 1 }, m.in);
                  tl.set(heading, { autoAlpha: 1 }, m.in);
                  if (arcMask) {
                    tl.fromTo(
                      arcMask,
                      { attr: { width: 0 } },
                      { attr: { width: ARC_W * 1.7 }, duration: budget * 0.8, ease: "power1.inOut" },
                      m.in + 0.1,
                    );
                  }
                  tl.fromTo(heading, { y: 18 }, { y: 0, duration: budget * 0.8, ease: "power2.out" }, m.in + 0.1);
                  if (body) {
                    tl.fromTo(
                      body,
                      { autoAlpha: 0, y: 16 },
                      { autoAlpha: 1, y: 0, duration: budget * 0.5, ease: "power2.out" },
                      m.in + budget * 0.5,
                    );
                  }
                  break;
                }
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
                  /* zoom in as the video scrolls forward into the next frames */
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
                case "through": {
                  /* the camera flies through the middle of the words: they settle, then
                     grow ever faster from their centre until they pass the screen edges */
                  const origin = "50% 50%";
                  const fly = (m.out ?? 100) - m.at;
                  tl.fromTo(
                    inner,
                    { autoAlpha: 0, scale: 0.86 },
                    { autoAlpha: 1, scale: 1, duration: budget, ease: "power2.out", transformOrigin: origin },
                    m.in,
                  );
                  /* 2D transforms so the glyphs re-raster sharp at every size */
                  tl.to(
                    inner,
                    { scale: 38, rotate: -14, duration: fly, ease: "power3.in", force3D: false, transformOrigin: origin },
                    m.at,
                  );
                  /* plum -> MilkaBoo pink -> milk white as the words swallow the screen */
                  tl.to(heading, { color: "#ff5faf", duration: fly * 0.45, ease: "power1.in" }, m.at);
                  tl.to(heading, { color: "#fbf9fd", duration: fly * 0.35, ease: "power1.in" }, m.at + fly * 0.45);

                  /* the burst, the flash and the dust sit on the words' centre, which the zoom never moves */
                  const copy = inner.parentElement!;
                  const centre = () => {
                    const c = copy.getBoundingClientRect();
                    const a = inner.getBoundingClientRect();
                    return { x: a.left + a.width / 2 - c.left, y: a.top + a.height / 2 - c.top };
                  };
                  const dustCanvas = copy.querySelector<HTMLCanvasElement>(".hero__dust");
                  if (dustCanvas) {
                    const draw = makeDust(dustCanvas, centre);
                    const dust = { p: 0 };
                    tl.fromTo(
                      dust,
                      { p: 0 },
                      { p: 1, duration: (m.out ?? 100) + 1.5 - m.in, ease: "none", onUpdate: () => draw(dust.p) },
                      m.in,
                    );
                  }
                  const fx = copy.querySelector<HTMLElement>(".hero__fx");
                  if (fx) {
                    tl.set(fx, { left: () => centre().x, top: () => centre().y }, 0);

                    const vmax = () => Math.max(innerWidth, innerHeight) / 100;
                    const sparks = fx.querySelectorAll<HTMLElement>(".hero__sparkle");
                    sparks.forEach((spark, i) => {
                      const angle = i * 2.39996;
                      const dist = 30 + ((i * 23) % 34);
                      const delay = ((i * 7) % SPARKLES) / SPARKLES;
                      tl.fromTo(
                        spark,
                        { x: 0, y: 0, scale: 0, rotate: 0, autoAlpha: 0 },
                        {
                          x: () => Math.cos(angle) * dist * vmax(),
                          y: () => Math.sin(angle) * dist * vmax(),
                          scale: 1.7 + (i % 3) * 0.7,
                          rotate: 120 + (i % 4) * 60,
                          autoAlpha: 1,
                          duration: fly * 0.5,
                          ease: "power2.in",
                        },
                        m.at + fly * (0.15 + delay * 0.2),
                      );
                      tl.to(spark, { autoAlpha: 0, duration: fly * 0.18 }, m.at + fly * (0.55 + delay * 0.2));
                    });

                    const portal = fx.querySelector(".hero__portal");
                    tl.fromTo(
                      portal,
                      { scale: 0, autoAlpha: 0 },
                      { scale: 1, autoAlpha: 0.9, duration: fly * 0.5, ease: "power2.in" },
                      m.at + fly * 0.42,
                    );
                    tl.to(portal, { autoAlpha: 0, duration: fly * 0.3, ease: "power1.out" }, m.at + fly * 0.92);
                  }
                  /* drop the glow early: a halo blown up 38x is all paint and no charm */
                  tl.to(
                    heading,
                    { textShadow: "0px 0px 0px rgba(251, 249, 253, 0), 0px 0px 0px rgba(251, 249, 253, 0)", duration: fly * 0.35 },
                    m.at,
                  );
                  tl.to(inner, { autoAlpha: 0, duration: fly * 0.28, ease: "power1.in" }, m.at + fly * 0.72);
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
              if (m.anim === "through" && !reduce) {
                /* its fly-through is the exit */
              } else {
                /* over the bridge the camera pushes in and the bridge rises, so the words
                   lift with it on the way out instead of sliding into the railing */
                const lift = m.pos === "bridge" ? () => -innerHeight * 0.24 : -40;
                tl.to(inner, { autoAlpha: 0, y: reduce ? 0 : lift, duration: 3, ease: "power1.in" }, m.out - 3);
              }
            }
          });

          tl.set({}, {}, 100);

          /* scroll locks: when scrolling rests inside the pin, settle on the nearest moment */
          const st = tl.scrollTrigger;
          stRef.current = st ?? null;
          let retry = 0;
          const onScrollEnd = () => {
            window.clearTimeout(retry);
            const smooth = lenisRef.current;
            if (!smooth || !st) return;
            /* a dropped frame can fire scrollEnd while Lenis is still easing;
               snapping then would yank the page back to the previous stop */
            if (smooth.isScrolling) {
              retry = window.setTimeout(onScrollEnd, 150);
              return;
            }
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
            window.clearTimeout(retry);
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
          {m.anim === "through" && <canvas className="hero__dust" aria-hidden="true" />}
          {m.anim === "through" && (
            <div className="hero__fx" aria-hidden="true">
              <span className="hero__portal" />
              {Array.from({ length: SPARKLES }, (_, i) => (
                <span key={i} className="hero__sparkle" data-tone={i % 3}>
                  ✦
                </span>
              ))}
            </div>
          )}
          <div className="hero__copy__inner">
            <h2 className={`hero__heading${m.anim === "arc" ? " hero__heading--arc" : ""}`}>
              {m.anim === "arc" && (
                <>
                  <span className="sr-only">{m.heading}</span>
                  <svg className="hero__arc" viewBox={`0 0 ${ARC_W} ${ARC_H}`} aria-hidden="true">
                    <defs>
                      <path id={`arc-${m.id}`} className="hero__arcpath" d={ARC_PATH} />
                      <linearGradient id={`arc-feather-${m.id}`} x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0.86" stopColor="#fff" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0" />
                      </linearGradient>
                      <mask id={`arc-mask-${m.id}`} className="hero__arcmask" maskUnits="userSpaceOnUse">
                        <rect x="-60" y="-40" width="0" height={ARC_H + 80} fill={`url(#arc-feather-${m.id})`} />
                      </mask>
                    </defs>
                    <text className="hero__arctext" textAnchor="middle" mask={`url(#arc-mask-${m.id})`}>
                      <textPath href={`#arc-${m.id}`} startOffset="50%">
                        {m.heading}
                      </textPath>
                    </text>
                  </svg>
                </>
              )}
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
                : m.anim === "arc"
                ? null
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
