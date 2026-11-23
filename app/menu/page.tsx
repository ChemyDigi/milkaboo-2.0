import type { Metadata } from "next";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Menu | Milka Boo",
  description:
    "Explore our handcrafted menu: fresh milk teas, signature boba, and fruit refreshers shaken to order with magic.",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#f5effa] pt-[var(--header-h)]">
      <Menu />
      <Footer />
    </main>
  );
}
