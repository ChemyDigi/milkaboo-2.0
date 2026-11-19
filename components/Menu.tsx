"use client";

import { useState } from "react";

const CATEGORIES = ["All", "Fresh Milk Teas", "Signature Boba", "Fruit & Refreshers"] as const;

const MENU_ITEMS = [
  {
    name: "Classic Brown Sugar Pearl Milk",
    category: "Signature Boba",
    emoji: "🧋",
    color: "#f5e6d3",
    tag: "Bestseller",
    price: "$5.80",
    desc: "Warm caramelized tiger tapioca pearls, farm-fresh whole milk, and cold cream foam.",
  },
  {
    name: "Taro Stardust Milk Tea",
    category: "Fresh Milk Teas",
    emoji: "🍠",
    color: "#ebdff2",
    tag: "Fan Favorite",
    price: "$6.20",
    desc: "Real mashed purple taro, coconut cream drizzle, chewy crystal boba, and fresh milk.",
  },
  {
    name: "Matcha Melon Cloud",
    category: "Fresh Milk Teas",
    emoji: "🍵",
    color: "#e2f2e5",
    tag: "Seasonal",
    price: "$6.50",
    desc: "First-harvest Uji matcha layered over fragrant cantaloupe melon milk and popping pearls.",
  },
  {
    name: "Berry Blossom Rose Tea",
    category: "Fruit & Refreshers",
    emoji: "🍓",
    color: "#fce4ec",
    tag: "New",
    price: "$5.90",
    desc: "Cold-brewed rose jasmine tea, crushed fresh strawberries, and bouncy lychee jelly.",
  },
  {
    name: "Green Apple Orchard Fizz",
    category: "Fruit & Refreshers",
    emoji: "🍏",
    color: "#e8f5e9",
    tag: "Refreshing",
    price: "$5.40",
    desc: "Crisp green apple puree, sparkling botanical soda, aloe vera cubes, and a squeeze of lime.",
  },
  {
    name: "Golden Custard Milk Tea",
    category: "Fresh Milk Teas",
    emoji: "🍮",
    color: "#fff8e1",
    tag: "Velvety",
    price: "$6.20",
    desc: "Silky egg pudding ribbons layered with steeped Assam black tea and burnt caramel drizzle.",
  },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" className="relative w-full py-24 sm:py-32 px-4 sm:px-8 bg-[#f5effa] text-[#241a33]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-white/60 shadow-sm mb-4">
            <span className="text-sm">🧋</span>
            <span className="font-['Lato',sans-serif] text-xs font-bold uppercase tracking-widest text-[#5e5470]">
              Handcrafted Menu
            </span>
          </div>

          <h2 className="font-bherisi text-4xl sm:text-6xl text-[#241a33] mb-4">
            Shaken to <span className="text-[#ff5faf]">Perfection</span>
          </h2>
          <p className="font-['Lato',sans-serif] text-base sm:text-lg text-[#5e5470]">
            Customize your sweetness, ice level, and artisanal toppings at the counter.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 font-['Lato',sans-serif] text-xs sm:text-sm font-bold transition-all ${
                activeCategory === cat
                  ? "bg-[#241a33] text-white shadow-md scale-105"
                  : "bg-white/80 text-[#5e5470] hover:bg-white hover:text-[#241a33] border border-white/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.name}
              className="group relative rounded-3xl bg-white p-6 shadow-sm border border-purple-100/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <span className="rounded-full bg-[#fbd3f1]/70 px-3 py-1 font-['Lato',sans-serif] text-[11px] font-extrabold text-[#ff5faf] uppercase tracking-wide">
                    {item.tag}
                  </span>
                </div>

                <h3 className="font-bherisi text-xl text-[#241a33] mb-2 group-hover:text-[#ff5faf] transition-colors">
                  {item.name}
                </h3>
                <p className="font-['Lato',sans-serif] text-xs text-[#5e5470] leading-relaxed mb-6">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-50">
                <span className="font-['Lato',sans-serif] text-lg font-black text-[#241a33]">
                  {item.price}
                </span>
                <span className="font-['Lato',sans-serif] text-xs font-bold text-[#ff5faf] group-hover:underline">
                  Order at Cart →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
