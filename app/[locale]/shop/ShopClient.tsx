"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  Search,
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

type ShopCategory =
  | "sutra"
  | "incense"
  | "statue"
  | "mala"
  | "ritual"
  | "blessing"
  | "other";

type ShopProduct = {
  _id: string;
  name: { mn: string; en: string };
  description?: { mn?: string; en?: string };
  price: number;
  images: string[];
  category: ShopCategory;
  stock: number; // -1 unlimited
  isActive: boolean;
  isFeatured: boolean;
  type: "physical" | "digital";
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="app-card-premium p-3">
          <Skeleton className="aspect-square w-full mb-3" />
          <Skeleton className="h-4 w-4/5 mb-2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
    </div>
  );
}

const CATEGORIES: Array<{
  id: "all" | ShopCategory;
  label: { mn: string; en: string };
}> = [
  { id: "all", label: { mn: "Бүгд", en: "All" } },
  { id: "sutra", label: { mn: "Ном судар", en: "Sutra" } },
  { id: "incense", label: { mn: "Хүж", en: "Incense" } },
  { id: "statue", label: { mn: "Бурхан", en: "Statue" } },
  { id: "mala", label: { mn: "Эрих", en: "Mala" } },
  { id: "ritual", label: { mn: "Тахил", en: "Ritual" } },
  { id: "blessing", label: { mn: "Адислал", en: "Blessing" } },
];

const pillActive = "bg-[var(--color-gold)] text-white";
const pillInactive =
  "bg-white/60 border border-gold/20 text-ink hover:bg-white/80";

export default function ShopClient({ products }: { products: ShopProduct[] }) {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { totalItems } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<"all" | ShopCategory>(
    "all",
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? [])
      .filter((p) => p?.isActive !== false)
      .filter((p) => (selectedCategory === "all" ? true : p.category === selectedCategory))
      .filter((p) => {
        if (!q) return true;
        const mn = (p.name?.mn ?? "").toLowerCase();
        const en = (p.name?.en ?? "").toLowerCase();
        return mn.includes(q) || en.includes(q);
      });
  }, [products, query, selectedCategory]);

  const featured = useMemo(
    () => filtered.filter((p) => p.isFeatured),
    [filtered],
  );

  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.02 },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const openDrawer = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("cart:open"));
  };

  const hasProducts = (products ?? []).length > 0;

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      {/* Header (BookingPageClient-style) */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-[0.99] transition"
          aria-label={t({ mn: "Буцах", en: "Back" })}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1
            className="text-h1 text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t({ mn: "Дэлгүүр", en: "Shop" })}
          </h1>
        </div>

        <button
          type="button"
          onClick={openDrawer}
          className="relative h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-[0.99] transition"
          aria-label={t({ mn: "Сагс", en: "Cart" })}
        >
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[var(--color-gold)] text-white text-[11px] font-black flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 mb-4">
        {CATEGORIES.map((c) => {
          const active = c.id === selectedCategory;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                active ? pillActive : pillInactive
              }`}
            >
              {c.label[lang]}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="app-card-premium p-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-35" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ mn: "Бараа хайх...", en: "Search products..." })}
            className="w-full rounded-2xl bg-white border border-black/[0.06] pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(191,164,106,0.25)]"
          />
        </div>
      </div>

      {!hasProducts ? (
        <ProductSkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="app-card-premium p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-black/[0.04] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-earth" />
          </div>
          <p className="text-h2 mt-4">
            {t({ mn: "Бүтээгдэхүүн олдсонгүй", en: "No products found" })}
          </p>
        </div>
      ) : (
        <>
          {/* Featured row */}
          {featured.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                <p className="text-label">
                  {t({ mn: "Онцлох бүтээгдэхүүн", en: "Featured products" })}
                </p>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
                {featured.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => router.push(`/shop/${p._id}`)}
                    className="shrink-0 w-56 text-left app-card-premium overflow-hidden"
                  >
                    <div className="relative aspect-square bg-ios-grouped">
                      <Image
                        src={p.images?.[0] || "/placeholder.png"}
                        alt={(lang === "mn" ? p.name.mn : p.name.en) || "Product"}
                        fill
                        sizes="224px"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold line-clamp-1">
                        {lang === "mn" ? p.name.mn : p.name.en}
                      </p>
                      <p className="text-secondary mt-1 font-black">
                        ₮{Number(p.price ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product grid */}
          <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const outOfStock = p.stock === 0;
              const lowStock = p.stock > 0 && p.stock < 5;
              const title = lang === "mn" ? p.name.mn : p.name.en;
              const img = p.images?.[0];
              return (
                <motion.button
                  key={p._id}
                  type="button"
                  variants={cardVariants}
                  onClick={() => router.push(`/shop/${p._id}`)}
                  className="text-left app-card-premium p-3 active:scale-[0.99] transition"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-ios-grouped">
                    {img ? (
                      <Image
                        src={img}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-light text-sm">
                        {t({ mn: "Зураггүй", en: "No image" })}
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-earth">
                          {t({ mn: "ДУУСCАН", en: "SOLD OUT" })}
                        </span>
                      </div>
                    )}
                    {lowStock && (
                      <span className="absolute left-2 top-2 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-black">
                        {t({ mn: `Сүүлийн ${p.stock} ширхэг`, en: `Only ${p.stock} left` })}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">
                      {title}
                    </p>
                    <p className="mt-1 text-[var(--color-gold-dark)] font-black">
                      ₮{Number(p.price ?? 0).toLocaleString()}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

