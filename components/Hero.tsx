"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";

const SOURCE_SECONDS = 53;

/* the steps of the journey, written over the video around these moments; the ones that hold freeze it */
const STOPS = [
  {
    at: 3.4,
    step: "01",
    /* the cow pouring the milk: the one frame the video holds on */
    hold: true,
    title: [
      { text: "Fresh Milk,", tone: "cream" },
      { text: "Magic Begins", tone: "pink" },
    ],
    body: "Every Milkaboo adventure starts with creamy fresh milk, poured into the secret well that leads to our underground bubble tea factory.",
  },
  {
    at: 10.4,
    step: "02",
    place: "low",
    title: [
      { text: "Swirl, Sparkle,", tone: "cream" },
      { text: "Down We Go", tone: "pink" },
    ],
    body: "The milk swirls into a sparkling whirlpool, spinning deeper and deeper through twinkling stardust on its way to the hidden world below.",
  },
  {
    at: 13.3,
    step: "03",
    place: "top",
    /* the headline bends like a sign hung over the bridge */
    arc: true,
    title: [
      { text: "Welcome to the", tone: "cream", small: true },
      { text: "Milkaboo Factory", tone: "pink" },
    ],
    body: "Where our busy crew of Milkaboo friends picks, checks and stirs every batch into bubble tea magic.",
  },
  {
    at: 22.7,
    step: "04",
    place: "top",
    /* arched over the mouth of the cave, with the orchard glowing through it */
    arc: true,
    title: [
      { text: "Fresh-picked", tone: "cream", small: true },
      { text: "Green Apple Bliss", tone: "apple" },
    ],
    body: "Beyond the glowing cave lies our secret orchard, where crisp green apples are picked at their juiciest for our zesty Apple Milk Tea.",
  },
  {
    at: 30,
    step: "05",
    place: "right",
    title: [
      { text: "Petal-soft", tone: "cream", small: true },
      { text: "Rose Garden", tone: "rose" },
    ],
    body: "Deeper in the cave, our roses bloom all year round. Their fragrant petals are gathered by hand to steep a delicate, floral Rose Milk Tea.",
  },
  {
    at: 38.4,
    step: "06",
    place: "top",
    title: [
      { text: "Silky-smooth", tone: "cream", small: true },
      { text: "Custard Cove", tone: "custard" },
    ],
    body: "Golden custard flows past wobbly caramel puddings, whisked into a rich, velvety Custard Milk Tea with a hint of burnt caramel.",
  },
  {
    at: 51.4,
    step: "07",
    place: "right",
    title: [
      { text: "Plucked from the", tone: "cream", small: true },
      { text: "Boba Trees", tone: "boba" },
    ],
    body: "Plump, chewy pearls ripen on our magical boba trees, plucked fresh by the basketful and dropped into every cup of bubble tea.",
  },
] as const;

/* headline fills, top to bottom of each letter */
const TONES = {
  cream: ["#fffdf7", "#f5e9ff"],
  pink: ["#fff1fb", "#ee8fd6"],
  apple: ["#fbffec", "#9fdc4f"],
  rose: ["#fff4f6", "#ff8fab"],
  custard: ["#fff1b8", "#f2a51c"],
  boba: ["#fff4e6", "#d08c52"],
} as const;

/* a line's words as letters, each with its place along the line from -1 (first) to 1 (last) */
function letters(text: string) {
  const n = text.replace(/ /g, "").length;
  let k = 0;
  return text.split(" ").map((word) => [...word].map((c) => ({ c, u: n > 1 ? (k++ * 2) / (n - 1) - 1 : 0 })));
}

/* scroll lengths, in % of the viewport */
const PER_SECOND = 7.5; /* of video playback */
/* the video plays this many times slower while a step's copy is up; 1 lets it run straight through */
const SLOW = 1;
/* seconds of video over which it changes pace, either way */
const RAMP = 1;
const MIN_LEAD = 40; /* the shortest run into a freeze */
const HOLD = 16; /* frozen, with its copy up, before the video carries on */
/* scrolling down past a freeze stops the page here until its copy is fully written */
const LOCK_PAST = 3;
/* the copy of a step that doesn't hold is up while the video plays through it, in seconds of video */
const SHOW_BEFORE = 1;
const SHOW_FOR = 4;
/* the stretch of video each step that doesn't hold is written over */
const SPANS = STOPS.map((stop, i) => {
  if ("hold" in stop) return null;
  const next = STOPS[i + 1]?.at ?? Infinity;
  return { a: stop.at - SHOW_BEFORE, b: Math.min(stop.at + SHOW_FOR, next - SHOW_BEFORE, SOURCE_SECONDS) };
});

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

          let locked = false;
          const unlock = () => {
            locked = false;
            lenisRef.current?.start();
          };

          /* lay the scroll out: the video runs at PER_SECOND, eases down to a crawl while each step's copy is up,
             and freezes outright on the ones that hold */
          const playhead = { t: 0 };
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate: () => {
              target = playhead.t;
            },
          });
          const CRAWL = PER_SECOND * SLOW;
          let pos = 0; /* scroll laid out so far */
          let from = 0; /* and the video time it reaches */
          let slow = false;
          /* play on to `to`, at `rate` % of scroll per second of video */
          const play = (to: number, rate: number) => {
            if (to <= from) return;
            const length = (to - from) * rate;
            tl.to(playhead, { t: to, duration: length }, pos);
            pos += length;
            from = to;
          };
          /* play on to `to`, with the pace changing steadily from one rate to the other */
          const shift = (to: number, rate: number, toRate: number) => {
            if (to <= from) return;
            /* in seconds of video per % of scroll, which is what changes at a steady rate */
            const a = 1 / rate;
            const b = 1 / toRate;
            const length = (2 * (to - from)) / (a + b);
            tl.to(playhead, { t: to, duration: length, ease: (p) => (2 * a * p + (b - a) * p * p) / (a + b) }, pos);
            pos += length;
            from = to;
          };
          const copies = section.querySelectorAll<HTMLElement>(".hero__copy");
          const stops = STOPS.map((stop, i) => {
            const span = SPANS[i];
            const held = !span;
            /* where the scroll freezes the video on a held step's frame */
            let freeze = 0;
            if (held) {
              const lead = Math.max(MIN_LEAD, (stop.at - from) * (slow ? CRAWL : PER_SECOND));
              tl.to(playhead, { t: stop.at, duration: lead }, pos);
              freeze = pos + lead;
              pos = freeze + HOLD;
              from = stop.at;
              slow = false;
            } else {
              const { a, b } = span;
              if (slow) {
                play(a, CRAWL);
              } else {
                play(a - RAMP, PER_SECOND);
                shift(a, PER_SECOND, CRAWL);
                slow = true;
              }
              play(b, CRAWL);
              /* pick the pace back up, unless the next step's copy is due before it could */
              const next = SPANS[i + 1]?.a ?? STOPS[i + 1]?.at ?? SOURCE_SECONDS;
              if (next - b >= 2 * RAMP) {
                shift(b + RAMP, CRAWL, PER_SECOND);
                slow = false;
              }
            }

            const el = copies[i];
            const q = gsap.utils.selector(el);
            /* the copy plays at its own pace, so it is always fully written however fast the scroll is */
            const copy = gsap.timeline({
              paused: true,
              defaults: { ease: "power3.out" },
              onComplete: () => {
                if (locked) unlock();
              },
            });
            copy.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 });
            if (reduce) {
              copy.from(el.children, { autoAlpha: 0, duration: 0.4 });
            } else {
              copy
                .from(q(".hero__cloud"), { autoAlpha: 0, scale: 0.8, duration: 0.7, ease: "back.out(1.6)" })
                .from(q(".hero__eyebrow"), { autoAlpha: 0, x: -16, duration: 0.45 }, 0.15)
                .from(q(".hero__step"), { autoAlpha: 0, scale: 0.4, duration: 0.5, ease: "back.out(2.4)" }, 0.3)
                .from(
                  /* each letter's stroke and fill, which move as one; the wrapper stays put so that every stroke can
                     sit under every fill */
                  q(".hero__char > *"),
                  {
                    autoAlpha: 0,
                    y: "0.4em",
                    scale: 0.5,
                    rotate: -10,
                    duration: 0.45,
                    ease: "back.out(2.2)",
                    stagger: (i: number) => Math.floor(i / 2) * 0.045,
                  },
                  0.4,
                )
                .from(q(".hero__spark"), { autoAlpha: 0, scale: 0, duration: 0.4, ease: "back.out(3)", stagger: 0.08 }, ">-0.3")
                .from(q(".hero__word"), { autoAlpha: 0, y: 6, duration: 0.25, stagger: 0.035 }, "<")
                .from(q(".hero__cue"), { autoAlpha: 0, y: 10, duration: 0.4 }, ">-0.1");
            }

            let shown = false;
            let fade: gsap.core.Tween | undefined;
            return {
              held,
              at: stop.at,
              span,
              freeze,
              copy,
              /* armed again whenever the scroll goes back above the freeze */
              armed: true,
              show(next: boolean, speed = 0) {
                if (next === shown) return;
                shown = next;
                fade?.kill();
                if (next) {
                  gsap.set(el, { y: 0 });
                  copy.play(0);
                  return;
                }
                /* written in letter by letter, but gone in one quick fade so the video can carry on */
                copy.pause();
                fade = gsap.to(el, {
                  autoAlpha: 0,
                  y: reduce ? 0 : -24,
                  /* the harder the scroll, the quicker it goes: 0.2s at rest, down to 0.05s */
                  duration: gsap.utils.clamp(0.05, 0.2, 0.2 - speed / 20000),
                  ease: "power2.in",
                  onComplete: () => {
                    copy.pause(0);
                    gsap.set(el, { y: 0 });
                  },
                });
              },
            };
          });
          /* and on to the end of the video */
          const rest = Math.max(0, SOURCE_SECONDS - from) * (slow ? CRAWL : PER_SECOND);
          tl.to(playhead, { t: () => video.duration || SOURCE_SECONDS, duration: rest }, pos);
          const total = pos + rest;
          /* when the lock last closed, so its copy needn't wait on a video that cannot seek */
          let lockedAt = 0;

          const trigger = ScrollTrigger.create({
            animation: tl,
            trigger: section,
            start: "top top",
            end: `+=${total}%`,
            pin: true,
            scrub: reduce ? true : 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const at = self.progress * total;
              const lenis = lenisRef.current;
              for (const stop of stops) {
                if (!stop.held) continue;
                if (at < stop.freeze) stop.armed = true;
                const lock = stop.freeze + LOCK_PAST;
                if (stop.armed && lenis && self.direction > 0 && at >= lock) {
                  stop.armed = false;
                  locked = true;
                  lenis.scrollTo(self.start + (lock / total) * (self.end - self.start), {
                    immediate: true,
                    force: true,
                  });
                  lenis.stop();
                  lockedAt = gsap.ticker.time;
                  stops.forEach((s) => {
                    if (s !== stop) s.show(false);
                  });
                  if (stop.copy.progress() === 1) unlock();
                  return;
                }
              }
            },
          });

          /* the step whose frame is up: a held one while the timeline holds on its frame and the video has all but
             reached it, the others while the frame is in their stretch, going either way. the lock on the way down
             makes sure a held copy is written; and once any copy has begun it stays until it is written, unless
             another's frame is up, so a fast scroll still shows it */
          const sync = () => {
            const speed = Math.abs(trigger.getVelocity());
            const stalled = locked && gsap.ticker.time - lockedAt > 1.5;
            const live = stops.find((s) =>
              s.span
                ? current >= s.span.a && current < s.span.b
                : Math.abs(target - s.at) < 0.001 && (Math.abs(current - s.at) < 0.25 || stalled),
            );
            stops.forEach((s) => {
              if (s === live) {
                s.copy.timeScale(1);
                s.show(true);
              } else if (live || s.copy.progress() === 1) {
                s.show(false, speed);
              } else if (s.copy.isActive()) {
                /* its frame has gone, so it finishes writing in a hurry */
                s.copy.timeScale(3);
              }
            });
          };
          gsap.ticker.add(sync);

          return () => {
            gsap.ticker.remove(sync);
            if (locked) unlock();
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

      {STOPS.map((stop, i) => {
        const Title = i === 0 ? "h1" : "h2";
        return (
          <div
            key={stop.step}
            className={"place" in stop ? `hero__copy hero__copy--${stop.place}` : "hero__copy"}
          >
            <div className="hero__cloud" aria-hidden="true" />

            <p className="hero__kicker">
              <span className="hero__eyebrow">The Milkaboo Journey</span>
              <span className="hero__step">
                Step {stop.step}
                <svg className="hero__spark hero__spark--ticks" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9 3 3M13 7l2-6M16 12l6-2" />
                </svg>
              </span>
            </p>

            <Title
              className={`hero__title font-bherisi${"arc" in stop ? " hero__title--arc" : ""}`}
              aria-label={stop.title.map((l) => l.text).join(" ")}>
              <svg className="hero__spark hero__spark--star" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z" />
              </svg>
              {stop.title.map((line) => (
                <span
                  key={line.text}
                  className={`hero__line${"small" in line ? " hero__line--small" : ""}`}
                  style={{ "--fill-top": TONES[line.tone][0], "--fill-bottom": TONES[line.tone][1] } as CSSProperties}
                  aria-hidden="true"
                >
                  {letters(line.text).map((word, w) => (
                    <Fragment key={w}>
                      {w > 0 && " "}
                      <span className="hero__nowrap">
                        {word.map(({ c, u }, j) => (
                          <span key={j} className="hero__char" style={{ "--u": u } as CSSProperties}>
                            <span className="hero__char-stroke">{c}</span>
                            <span className="hero__char-fill">{c}</span>
                          </span>
                        ))}
                      </span>
                    </Fragment>
                  ))}
                </span>
              ))}
              <svg className="hero__spark hero__spark--splash" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M6 4 3 14M14 10l14-6M14 20l12 2" />
              </svg>
            </Title>

            <p className="hero__body">
              {stop.body.split(" ").map((word, j) => (
                <Fragment key={j}>
                  {j > 0 && " "}
                  <span className="hero__word">{word}</span>
                </Fragment>
              ))}
            </p>

            <p className="hero__cue">
              <span className="hero__cue-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </span>
              Scroll to continue the journey
            </p>
          </div>
        );
      })}
    </section>
  );
}
