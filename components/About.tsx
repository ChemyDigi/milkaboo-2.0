"use client";

import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="relative w-full py-24 sm:py-32 px-4 sm:px-8 bg-[#ebe2f4] text-[#241a33] overflow-hidden">
      {/* Decorative background clouds / blur */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#fbd3f1]/40 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-white/60 shadow-sm mb-4">
            <span className="text-sm">🌸</span>
            <span className="font-['Lato',sans-serif] text-xs font-bold uppercase tracking-widest text-[#5e5470]">
              Our Story
            </span>
          </div>

          <h2 className="font-bherisi text-4xl sm:text-6xl text-[#241a33] mb-6 leading-tight">
            Fresh Milk, <span className="text-[#ff5faf]">Pure Magic</span>
          </h2>

          <p className="font-['Lato',sans-serif] text-base sm:text-lg text-[#5e5470] leading-relaxed">
            Every Milkaboo adventure starts right here in the sunny meadow with creamy, farm-fresh milk shaken to order with slow-simmered pearls, organic fruit purees, and lots of love.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="rounded-3xl bg-white/80 p-8 shadow-sm border border-white/70 transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#ffebf7] flex items-center justify-center text-2xl mb-6 shadow-inner">
              🥛
            </div>
            <h3 className="font-bherisi text-2xl text-[#241a33] mb-3">100% Farm Fresh</h3>
            <p className="font-['Lato',sans-serif] text-sm text-[#5e5470] leading-relaxed">
              We never use artificial milk powders. Only rich, creamy dairy sourced daily from happy free-range herds.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 p-8 shadow-sm border border-white/70 transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#fdf4db] flex items-center justify-center text-2xl mb-6 shadow-inner">
              🧋
            </div>
            <h3 className="font-bherisi text-2xl text-[#241a33] mb-3">Handcrafted Pearls</h3>
            <p className="font-['Lato',sans-serif] text-sm text-[#5e5470] leading-relaxed">
              Slow-cooked in dark muscovado brown sugar every two hours so each bite is perfectly warm, chewy, and tender.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 p-8 shadow-sm border border-white/70 transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#ebf7ea] flex items-center justify-center text-2xl mb-6 shadow-inner">
              🍓
            </div>
            <h3 className="font-bherisi text-2xl text-[#241a33] mb-3">Real Fruit & Teas</h3>
            <p className="font-['Lato',sans-serif] text-sm text-[#5e5470] leading-relaxed">
              Hand-plucked loose leaf teas steeped fresh, layered with ripe seasonal fruit purees and fragrant floral notes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
