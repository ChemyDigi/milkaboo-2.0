"use client";

import { useEffect, ViewTransition, type ReactNode } from "react";

/**
 * Animates route changes. The outgoing page sinks back while the incoming one opens as a circle
 * (the page's one shape) from wherever the visitor clicked. Wrap each page's content in this,
 * not the layout: layouts persist across navigations, so enter and exit never fire there.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  /* remember where the navigation started, so the circle can open from that point */
  useEffect(() => {
    const root = document.documentElement;
    const onClick = (e: MouseEvent) => {
      let x = e.clientX;
      let y = e.clientY;
      /* keyboard activation reports 0,0: use the centre of the focused control instead */
      if (e.detail === 0 && e.target instanceof Element) {
        const r = e.target.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      root.style.setProperty("--vt-x", `${x}px`);
      root.style.setProperty("--vt-y", `${y}px`);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
