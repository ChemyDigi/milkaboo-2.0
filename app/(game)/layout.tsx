import type { ReactNode } from "react";
import { Lato } from "next/font/google";
import localFont from "next/font/local";
import "./game.css";

// The game loads its own copies of the brand fonts under its own variable names, so it renders right
// whatever the site's global font tokens do. Same files as the site, so browsers cache them once.
const display = localFont({ src: "../../public/fonts/Bherisi-Regular.ttf", variable: "--g-font-display", display: "swap" });
const text = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--g-font-text", display: "swap" });

/** Full-screen, no site header or smooth scroll: the game owns the whole viewport. */
export default function GameLayout({ children }: { children: ReactNode }) {
  return <div className={`${display.variable} ${text.variable} contents`}>{children}</div>;
}
