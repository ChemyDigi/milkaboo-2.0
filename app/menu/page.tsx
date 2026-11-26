import type { Metadata } from "next";
import { Sansita } from "next/font/google";
import localFont from "next/font/local";
import ProductsPage from "@/components/ProductsPage";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const bherisi = localFont({
  src: "../../public/fonts/Bherisi-Regular.ttf",
  variable: "--font-bherisi",
  display: "swap",
});

/* the font for the product body and labels */
const sansita = Sansita({
  weight: ["400", "700", "800", "900"],
  variable: "--font-sansita",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Menu | Milka Boo",
  description:
    "Explore our handcrafted menu: fresh milk teas, signature boba, and fruit refreshers shaken to order with magic.",
};

export default function MenuPage() {
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col bg-[#ede6f6]">
        <div className={`${bherisi.variable} ${sansita.variable} milkaboo-products flex-1 flex flex-col bg-[#ede6f6]`}>
          <ProductsPage />
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
