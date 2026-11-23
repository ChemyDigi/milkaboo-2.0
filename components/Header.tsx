"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLenis } from "@/components/SmoothScroll";

/** Logo at the left. No bar: the page's own ground shows through. */
export default function Header() {
  const header = useRef<HTMLElement>(null);
  const lenis = useLenis();

  /* hides when scrolling down past the hero, returns on the first scroll up */
  useEffect(() => {
    if (!lenis) return;
    const off = lenis.on("scroll", (l) => {
      const el = header.current;
      if (!el) return;
      const pastHero = l.scroll > innerHeight * 5.5;
      const hide = l.direction === 1 && pastHero;
      el.classList.toggle("is-hidden", hide);
    });
    return off;
  }, [lenis]);

  return (
    <header ref={header} className="header">
      <Link className="header__logo" href="/" aria-label="Milka Boo, home">
        <Image src="/images/logo.png" alt="Milka Boo" width={144} height={225} priority />
      </Link>
    </header>
  );
}
