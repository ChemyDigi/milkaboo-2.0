import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";

const bherisi = localFont({
  src: "../public/fonts/Bherisi-Regular.ttf",
  variable: "--font-bherisi",
  display: "swap",
});

const jamoaScript = localFont({
  src: "../public/fonts/JamoaScript.ttf",
  variable: "--font-jamoa",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Milka Boo",
  description:
    "Milka Boo is a bubble tea shop: milk teas, fruit teas and brown sugar pearls, shaken to order with fresh milk.",
};

export const viewport: Viewport = {
  themeColor: "#ebe2f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bherisi.variable} ${jamoaScript.variable} ${lato.variable}`}>
      <body>
        <SmoothScroll>
          <Header />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
