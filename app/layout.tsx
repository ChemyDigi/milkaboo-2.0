import type { Metadata, Viewport } from "next";
import { Stack_Sans_Headline, Stack_Sans_Text } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";

const headline = Stack_Sans_Headline({
  variable: "--font-stack-headline",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const text = Stack_Sans_Text({
  variable: "--font-stack-text",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
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
    <html lang="en" className={`${headline.variable} ${text.variable}`}>
      <body>
        <SmoothScroll>
          <Header />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
