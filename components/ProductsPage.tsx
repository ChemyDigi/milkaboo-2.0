"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, ShoppingBag, Heart, Star, Check, SlidersHorizontal, Plus } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: "signature" | "fruit" | "special";
  flavor: string;
  tagline: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  tags: string[];
  floatImg1?: string;
  floatImg2?: string;
}

const allProducts: ProductItem[] = [
  {
    id: "rose-milkaboo",
    name: "Rose Milkaboo",
    category: "signature",
    flavor: "Damask Rose & Velvet Milk",
    tagline: "Floral, Creamy & Enchanting",
    description:
      "A delicate fusion of fragrant damask rose extracts, rich velvet milk tea, and chewy dark tapioca pearls topped with edible rose petals.",
    price: "$6.50",
    rating: 4.9,
    reviews: 142,
    image: "/images/hand.png",
    accentBg: "from-pink-100 to-rose-200",
    badgeBg: "bg-pink-100 border-pink-200",
    badgeText: "text-pink-700",
    tags: ["Real Rose Petals", "Velvet Milk", "Fresh Boba"],
    floatImg1: "/images/Home/rosemilka1.png",
    floatImg2: "/images/Home/boba1.png",
  },
  {
    id: "apple-milkaboo",
    name: "Apple Milkaboo",
    category: "fruit",
    flavor: "Orchard Green Apple",
    tagline: "Crisp, Tangy & Refreshing",
    description:
      "Infused with crisp orchard green apple essence, silky milk blend, and golden popping boba for a bright, fruity burst in every single sip.",
    price: "$6.25",
    rating: 4.8,
    reviews: 118,
    image: "/images/hand apple milkaboo.png",
    accentBg: "from-emerald-100 to-green-200",
    badgeBg: "bg-emerald-100 border-emerald-200",
    badgeText: "text-emerald-800",
    tags: ["Granny Smith Twist", "Sweet & Crisp", "Popping Boba"],
    floatImg1: "/images/applemilka1.png",
    floatImg2: "/images/boba2.png",
  },
  {
    id: "blackcurrant-milkaboo",
    name: "Blackcurrant Milkaboo",
    category: "fruit",
    flavor: "Wild Blackcurrant Reduction",
    tagline: "Bold, Berry-Rich & Vibrant",
    description:
      "Deep purple blackcurrant berry reduction layered over creamy milk tea with honey-soaked boba pearls for a rich sweet-tart experience.",
    price: "$6.75",
    rating: 4.9,
    reviews: 156,
    image: "/images/black current.png",
    accentBg: "from-purple-100 to-indigo-200",
    badgeBg: "bg-purple-100 border-purple-200",
    badgeText: "text-purple-800",
    tags: ["Wild Berry Reduction", "Cream Foam", "Honey Boba"],
    floatImg1: "/images/blackcurrentmilka1.png",
    floatImg2: "/images/boba1.png",
  },
  {
    id: "classic-boba-milkaboo",
    name: "Classic Brown Sugar Boba",
    category: "signature",
    flavor: "Caramelized Tiger Brown Sugar",
    tagline: "Rich, Chewy & Timeless",
    description:
      "Warm slow-cooked brown sugar tiger stripes swirled in chilled fresh dairy milk and double-boiled chewy black tapioca pearls.",
    price: "$6.00",
    rating: 5.0,
    reviews: 210,
    image: "/images/hand.png",
    accentBg: "from-amber-100 to-orange-200",
    badgeBg: "bg-amber-100 border-amber-200",
    badgeText: "text-amber-800",
    tags: ["Slow Cooked Sugar", "Fresh Dairy", "Tiger Stripes"],
    floatImg1: "/images/Home/boba1.png",
    floatImg2: "/images/Home/boba2.png",
  },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "signature" | "fruit">("all");
  const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredProducts =
    selectedCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory);

  const toggleLike = (id: string) => {
    setLikedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = (productName: string) => {
    setToastMessage(`Added ${productName} to your boo bag! 💜`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="relative w-full min-h-screen pt-32 sm:pt-36 md:pt-40 pb-24 px-4 sm:px-6 lg:px-8 bg-[#ede6f6] overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-neutral-950 text-white shadow-2xl border border-white/10 animate-bounce">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="font-[family-name:var(--font-sansita)] font-bold text-sm sm:text-base">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Floating Background Clouds */}
      <div className="absolute -left-28 top-20 w-[420px] h-[260px] pointer-events-none opacity-60 animate-float-slow [mask-image:radial-gradient(circle_at_center,black_45%,transparent_75%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_45%,transparent_75%)]">
        <Image src="/images/Home/Clouds.png" alt="Cloud" fill className="object-contain" />
      </div>
      <div className="absolute -right-28 top-40 w-[420px] h-[260px] pointer-events-none opacity-60 animate-float-reverse [mask-image:radial-gradient(circle_at_center,black_45%,transparent_75%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_45%,transparent_75%)]">
        <Image src="/images/Home/Clouds.png" alt="Cloud" fill className="object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-800 font-[family-name:var(--font-sansita)]">
              Handcrafted With Magic
            </span>
          </div>
          <h1
            style={{ fontFamily: "var(--font-bherisi)" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bherisi text-neutral-950 uppercase tracking-tight leading-[0.95]"
          >
            BOO-LICIOUS MENU
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl font-[family-name:var(--font-sansita)] font-bold text-neutral-700 max-w-xl mx-auto">
            Every drink is brewed fresh with premium tea leaves, silky dairy blends, and bouncy boba pearls.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mt-10 sm:mt-12 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {[
            { id: "all", label: "All Flavors" },
            { id: "signature", label: "Signature Milk" },
            { id: "fruit", label: "Fruity Magic" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-[family-name:var(--font-sansita)] font-bold transition-all duration-300 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-neutral-950 text-white shadow-md scale-105"
                  : "bg-white/80 backdrop-blur-md text-neutral-800 hover:bg-white hover:shadow-xs border border-white/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredProducts.map((product) => {
            const isLiked = likedProducts[product.id];
            return (
              <div
                key={product.id}
                className="group relative bg-white/70 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(147,51,234,0.14)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Top Badges */}
                <div className="flex items-center justify-between z-20">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${product.badgeBg} ${product.badgeText}`}
                  >
                    {product.tagline}
                  </span>
                  <button
                    onClick={() => toggleLike(product.id)}
                    aria-label="Favorite product"
                    className="w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-xs flex items-center justify-center transition-transform active:scale-90"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isLiked ? "fill-pink-500 text-pink-500" : "text-neutral-400 hover:text-neutral-700"
                      }`}
                    />
                  </button>
                </div>

                {/* Drink Visual Area */}
                <div className="relative w-full h-72 sm:h-80 my-4 flex items-center justify-center">
                  {/* Subtle Background Glow Radial */}
                  <div
                    className={`absolute inset-4 rounded-full bg-gradient-to-tr ${product.accentBg} opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500`}
                  />

                  {/* Main Drink Image */}
                  <div className="relative w-48 h-64 sm:w-56 sm:h-72 group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500 z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.16)]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Floating Elements on Card */}
                  {product.floatImg1 && (
                    <div className="absolute top-2 left-2 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:rotate-12 transition-transform duration-500 drop-shadow-md z-20 animate-float-gentle">
                      <Image src={product.floatImg1} alt="Ingredient" fill className="object-contain" />
                    </div>
                  )}
                  {product.floatImg2 && (
                    <div className="absolute bottom-4 right-2 w-12 h-12 sm:w-14 sm:h-14 pointer-events-none group-hover:translate-x-3 group-hover:translate-y-3 group-hover:-rotate-12 transition-transform duration-500 drop-shadow-md z-20 animate-float-reverse">
                      <Image src={product.floatImg2} alt="Boba" fill className="object-contain" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3
                      style={{ fontFamily: "var(--font-bherisi)" }}
                      className="text-2xl sm:text-3xl font-bherisi text-neutral-950 uppercase tracking-tight"
                    >
                      {product.name}
                    </h3>
                    <span
                      style={{ fontFamily: "var(--font-bherisi)" }}
                      className="text-xl sm:text-2xl font-bherisi text-neutral-900"
                    >
                      {product.price}
                    </span>
                  </div>

                  <p className="mt-2 text-sm sm:text-base font-[family-name:var(--font-sansita)] font-medium text-neutral-600 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-white/60 text-[11px] font-semibold text-neutral-700 border border-neutral-200/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Rating and CTA Button */}
                  <div className="mt-5 pt-4 border-t border-neutral-200/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-neutral-400">({product.reviews})</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product.name)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-950 text-white font-[family-name:var(--font-sansita)] font-bold text-sm shadow-md hover:bg-pink-600 hover:shadow-lg active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
