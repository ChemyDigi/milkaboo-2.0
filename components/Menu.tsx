"use client";

import { useState } from "react";

const CATEGORIES = ["All Flavors", "Signature Milk", "Fruity Magic"] as const;

const MENU_ITEMS = [
  {
    name: "Classic Brown Sugar Pearl Milk",
    category: "Signature Milk",
    emoji: "🧋",
    color: "#f5e6d3",
    tag: "Bestseller",
    price: "$5.80",
    desc: "Warm caramelized tiger tapioca pearls, farm-fresh whole milk, and cold cream foam.",
  },
  {
    name: "Taro Stardust Milk Tea",
    category: "Signature Milk",
    emoji: "🍠",
    color: "#ebdff2",
    tag: "Fan Favorite",
    price: "$6.20",
    desc: "Real mashed purple taro, coconut cream drizzle, chewy crystal boba, and fresh milk.",
  },
  {
    name: "Matcha Melon Cloud",
    category: "Signature Milk",
    emoji: "🍵",
    color: "#e2f2e5",
    tag: "Seasonal",
    price: "$6.50",
    desc: "First-harvest Uji matcha layered over fragrant cantaloupe melon milk and popping pearls.",
  },
  {
    name: "Berry Blossom Rose Tea",
    category: "Fruity Magic",
    emoji: "🍓",
    color: "#fce4ec",
    tag: "New",
    price: "$5.90",
    desc: "Cold-brewed rose jasmine tea, crushed fresh strawberries, and bouncy lychee jelly.",
  },
  {
    name: "Green Apple Orchard Fizz",
    category: "Fruity Magic",
    emoji: "🍏",
    color: "#e8f5e9",
    tag: "Refreshing",
    price: "$5.40",
    desc: "Crisp green apple puree, sparkling botanical soda, aloe vera cubes, and a squeeze of lime.",
  },
  {
    name: "Golden Custard Milk Tea",
    category: "Signature Milk",
    emoji: "🍮",
    color: "#fff8e1",
    tag: "Velvety",
    price: "$6.20",
    desc: "Silky egg pudding ribbons layered with steeped Assam black tea and burnt caramel drizzle.",
  },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<string>("All Flavors");

  const filtered =
    activeCategory === "All Flavors"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" className="relative w-full py-20 sm:py-28 px-4 sm:px-8 bg-[#f5effa] text-[#241a33]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white/70 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-[#ff7cbe]" />
            <span className="font-['Lato',sans-serif] text-xs font-bold uppercase tracking-wider text-[#241a33]">
              Handcrafted with Magic
            </span>
          </div>

          <h1 className="font-bherisi text-5xl sm:text-7xl font-bold tracking-tight text-[#140c22] uppercase mb-5 leading-none">
            Boo-Licious Menu
          </h1>
          <p className="font-['Lato',sans-serif] text-base sm:text-lg text-[#5e5470] max-w-xl mx-auto leading-relaxed">
            Every drink is brewed fresh with premium tea leaves, silky dairy blends, and bouncy boba pearls.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-7 py-2.5 font-['Lato',sans-serif] text-sm font-bold transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-[#140c22] text-white shadow-md scale-105"
                  : "bg-white text-[#241a33] hover:bg-white/90 shadow-sm border border-black/5"
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
