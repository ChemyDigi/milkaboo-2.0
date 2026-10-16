"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/* one Lenis instance for the page, published through a tiny external store */
let instance: Lenis | null = null;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => instance;
const getServerSnapshot = () => null;
const publish = (next: Lenis | null) => {
  instance = next;
  listeners.forEach((cb) => cb());
};

/** The current Lenis instance, or null before it exists. */
export function useLenis() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger and the scroll share one clock. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
      respectReducedMotion: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    publish(lenis);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      publish(null);
    };
  }, []);

  return <>{children}</>;
}
