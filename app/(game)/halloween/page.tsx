import type { Metadata, Viewport } from "next";
import HalloweenExperience from "@/components/halloween/HalloweenExperience";

export const metadata: Metadata = {
  title: "Halloween - Free the Milkaboo Cup | Milkaboo",
  description:
    "The ghosts have taken over! Our delicious Milkaboo flavours have been conquered by mischievous ghosts! Play a game, win the challenge, and claim a FREE drink!",
};

export const viewport: Viewport = {
  themeColor: "#0b0514",
  viewportFit: "cover",
};

export default function HalloweenPage() {
  return <HalloweenExperience />;
}
