"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import MenuButton from "@/components/MenuButton";
import NavOverlay from "@/components/NavOverlay";
import { useLenis } from "@/components/SmoothScroll";

/** Logo at the left, the menu button in the middle. No bar: the page's own ground shows through. */
export default function Header() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* hides when scrolling down past the hero, returns on the first scroll up */
  useEffect(() => {
    if (!lenis) return;
    const off = lenis.on("scroll", (l) => {
      const el = header.current;
      if (!el) return;
      const pastHero = l.scroll > innerHeight * 7.1;
      const hide = !openRef.current && l.direction === 1 && pastHero;
      el.classList.toggle("is-hidden", hide);
    });
    return off;
  }, [lenis]);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <header ref={header} className="header">
        <a className="header__logo" href="#top" aria-label="Milka Boo, home">
          <Image src="/images/logo.png" alt="Milka Boo" width={144} height={225} priority />
        </a>
        <div className="header__burger-slot">
          <MenuButton ref={button} open={open} onToggle={() => (open ? close() : setOpen(true))} />
        </div>
      </header>
      <NavOverlay open={open} onClose={close} originRef={button} />
    </>
  );
}
