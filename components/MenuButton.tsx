"use client";

import { useRef, type Ref } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/* Three straight lines (the mockup's resting state), three ripples (its hover state), and a cross for "open". */
const LINES = ["M3 7 L25 7", "M3 14 L25 14", "M3 21 L25 21"];
const WAVES = [
  "M3 7 C6.7 4.6 10.3 9.4 14 7 S21.3 9.4 25 7",
  "M3 14 C6.7 11.6 10.3 16.4 14 14 S21.3 16.4 25 14",
  "M3 21 C6.7 18.6 10.3 23.4 14 21 S21.3 23.4 25 21",
];
const CROSS_TOP = "M6 6 L22 22";
const CROSS_BOTTOM = "M6 22 L22 6";

type Props = {
  open: boolean;
  onToggle: () => void;
  ref?: Ref<HTMLButtonElement>;
};

export default function MenuButton({ open, onToggle, ref }: Props) {
  const scope = useRef<HTMLButtonElement>(null);
  const paths = useRef<SVGPathElement[]>([]);
  const hovering = useRef(false);

  const setRefs = (el: HTMLButtonElement | null) => {
    scope.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  /* open / close: lines become a cross and back */
  useGSAP(
    () => {
      const [top, mid, bottom] = paths.current;
      if (!top || !mid || !bottom) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const d = reduce ? 0.2 : 0.5;
      /* a ripple may still be queued from the hover or focus that preceded the click */
      gsap.killTweensOf(paths.current);
      const tl = gsap.timeline({ defaults: { duration: d, ease: "power3.out" } });
      if (open) {
        tl.to(top, { morphSVG: CROSS_TOP }, 0)
          .to(bottom, { morphSVG: CROSS_BOTTOM }, 0)
          .to(mid, { scaleX: 0, opacity: 0, transformOrigin: "50% 50%", duration: d * 0.6 }, 0);
      } else {
        const rest = hovering.current ? WAVES : LINES;
        tl.to(top, { morphSVG: rest[0] }, 0)
          .to(bottom, { morphSVG: rest[2] }, 0)
          .to(mid, { morphSVG: rest[1], scaleX: 1, opacity: 1, duration: d }, 0);
      }
    },
    { dependencies: [open], scope },
  );

  const ripple = (on: boolean) => {
    hovering.current = on;
    if (open) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const shapes = on ? WAVES : LINES;
    gsap.killTweensOf(paths.current);
    paths.current.forEach((p, i) => {
      gsap.to(p, { morphSVG: shapes[i], duration: on ? 0.45 : 0.35, ease: "power3.out", delay: i * 0.045 });
    });
  };

  return (
    <button
      ref={setRefs}
      type="button"
      className="burger"
      aria-expanded={open}
      aria-controls="site-nav"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onToggle}
      onPointerEnter={() => ripple(true)}
      onPointerLeave={() => ripple(false)}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) ripple(true);
      }}
      onBlur={() => ripple(false)}
    >
      <svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        {LINES.map((d, i) => (
          <path
            key={d}
            d={d}
            ref={(el) => {
              if (el) paths.current[i] = el;
            }}
          />
        ))}
      </svg>
    </button>
  );
}
