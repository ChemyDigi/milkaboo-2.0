"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";

const LINKS = [
  { href: "#menu", label: "Menu" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  originRef: RefObject<HTMLButtonElement | null>;
};

/** The full-page navigation. It opens as a circle from the menu button, the page's one shape. */
export default function NavOverlay({ open, onClose, originRef }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const everOpened = useRef(false);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (!open && !everOpened.current) return;
      everOpened.current = true;

      const btn = originRef.current;
      const r = btn?.getBoundingClientRect();
      const ox = r ? r.left + r.width / 2 : innerWidth / 2;
      const oy = r ? r.top + r.height / 2 : 48;
      const radius = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 20;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const k = reduce ? 0.35 : 1;
      const links = gsap.utils.toArray<HTMLElement>(".nav__link", el);
      const aside = el.querySelector(".nav__aside");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (open) {
        gsap.set(el, { clipPath: `circle(0px at ${ox}px ${oy}px)`, visibility: "visible" });
        tl.to(el, { clipPath: `circle(${radius}px at ${ox}px ${oy}px)`, duration: 0.85 * k, ease: "power3.inOut" })
          .fromTo(links, { y: reduce ? 0 : 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 * k, stagger: 0.07 * k }, 0.28 * k);
        if (aside) {
          tl.fromTo(aside, { y: reduce ? 0 : 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 * k }, 0.5 * k);
        }
      } else {
        tl.to(links, { y: reduce ? 0 : -24, opacity: 0, duration: 0.3 * k, stagger: 0.03 * k }, 0);
        if (aside) {
          tl.to(aside, { opacity: 0, duration: 0.3 * k }, 0);
        }
        tl.to(el, { clipPath: `circle(0px at ${ox}px ${oy}px)`, duration: 0.6 * k, ease: "power3.inOut" }, 0.05 * k)
          .set(el, { visibility: "hidden" });
      }
    },
    { dependencies: [open], scope: root },
  );

  /* scroll lock, escape, focus */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    if (open) {
      lenis?.stop();
      html.classList.add("nav-open");
      const first = el.querySelector<HTMLElement>(".nav__link");
      const t = window.setTimeout(() => first?.focus({ preventScroll: true }), 350);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }
        if (e.key !== "Tab") return;
        const focusables = [
          originRef.current,
          ...Array.from(el.querySelectorAll<HTMLElement>("a[href], button")),
        ].filter(Boolean) as HTMLElement[];
        const i = focusables.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && (i <= 0 || i === -1)) {
          e.preventDefault();
          focusables[focusables.length - 1].focus();
        } else if (!e.shiftKey && i === focusables.length - 1) {
          e.preventDefault();
          focusables[0].focus();
        }
      };
      document.addEventListener("keydown", onKey);
      return () => {
        window.clearTimeout(t);
        document.removeEventListener("keydown", onKey);
      };
    }
    html.classList.remove("nav-open");
    lenis?.start();
  }, [open, onClose, lenis, originRef]);

  const go = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClose();
    const target = document.querySelector<HTMLElement>(href);
    window.setTimeout(() => {
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView();
      history.replaceState(null, "", href);
    }, 420);
  };

  return (
    <div
      id="site-nav"
      ref={root}
      className="nav"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      data-open={open}
      inert={!open}
    >
      <ul className="nav__list">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a className="nav__link" href={l.href} onClick={go(l.href)}>
              <span>{l.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="nav__aside">
        <p>Open every day, 10 am to 10 pm</p>
        <p>
          Say Boo: <a className="link" href="mailto:hello@milkaboo.lk">hello@milkaboo.lk</a>
        </p>
      </div>
    </div>
  );
}
