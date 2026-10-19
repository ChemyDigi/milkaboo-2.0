import type { Metadata, Viewport } from "next";
import Game from "@/components/ui/Game";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy.title,
  description: copy.tagline,
};

export const viewport: Viewport = {
  themeColor: "#120a1f",
  viewportFit: "cover", // lets the game run under the notch; game.css pads with safe-area insets
};

export default function HalloweenPage() {
  return (
    <main className="game">
      <Game />
    </main>
  );
}
