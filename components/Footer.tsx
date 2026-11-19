"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#241a33] text-white py-16 px-4 sm:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
              🐮
            </div>
            <span className="font-bherisi text-2xl tracking-wide text-[#ff7cbe]">MILKA BOO</span>
          </div>
          <p className="font-['Lato',sans-serif] text-xs text-white/60 max-w-sm">
            Handcrafted boba and farm-fresh milk shaken with love in the sunny meadow.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 font-['Lato',sans-serif] text-xs text-white/70">
          <div>
            <p className="font-bold text-white mb-1">Meadow Hours</p>
            <p>Every Day: 10:00 AM – 10:00 PM</p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">Say Boo</p>
            <a href="mailto:hello@milkaboo.lk" className="hover:text-[#ff7cbe] transition-colors">
              hello@milkaboo.lk
            </a>
          </div>
        </div>

        <div className="font-['Lato',sans-serif] text-[11px] text-white/40">
          © {new Date().getFullYear()} Milka Boo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
