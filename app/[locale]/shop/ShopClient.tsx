"use client";

import React, { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import LargeHeader from "@/app/components/LargeHeader";
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

/**
 * ImageWithFallback — Next/Image wrapper that handles load failures gracefully.
 * If the src URL is invalid, blocked, or the domain isn't whitelisted,
 * shows a Buddhist-themed placeholder emoji instead of a broken image icon.
 */
function ImageWithFallback({
  src,
  alt,
  ...props
}: React.ComponentProps<typeof Image>) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F2E8] gap-1">
        <span style={{ fontSize: 32, lineHeight: 1 }}>☸️</span>
        <span style={{ fontSize: 10, color: "var(--ink-4)", fontWeight: 600, letterSpacing: "0.04em" }}>
          {alt || "Бүтээгдэхүүн"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      onError={() => setErrored(true)}
    />
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
    <div className="relative min-h-[100svh] flex flex-col bg-white pb-24 pt-[calc(56px+env(safe-area-inset-top,0px))] md:pt-[88px]">
      <header className="sticky z-30 border-b border-black/[0.06] bg-[rgba(248,248,250,0.85)] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_0_rgba(0,0,0,0.03)] top-[calc(56px+env(safe-area-inset-top,0px))] md:top-[80px]">
        <LargeHeader
          omitNavGutter
          title={t({ mn: "Шидийн", en: "Sacred" })}
          highlight={t({ mn: "Дэлгүүр", en: "Shop" })}
          subtitle={t({
            mn: "Ном судар, рашаан, адислалын эд зүйлс",
            en: "Sutras, blessed items and more",
          })}
        />

        <div className="space-y-3 px-5 pb-4 md:px-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {CATEGORIES.map((c) => {
              const active = c.id === selectedCategory;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-all border ${
                    active
                      ? "border-gold/45 bg-[#F2F2F7] text-gold"
                      : "border-transparent bg-[#F2F2F7] text-neutral-600 hover:bg-neutral-200/80 hover:text-ink"
                  }`}
                >
                  {c.label[lang]}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-earth/30"
              size={15}
              strokeWidth={2.5}
            />
            <input
              type="search"
              placeholder={t({ mn: "Бараа хайх...", en: "Search products..." })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-[16px] border-0 bg-black/[0.04] py-2.5 pl-9 pr-10 text-[15px] font-medium text-ink outline-none ring-0 placeholder:text-earth/40 focus:bg-black/[0.06] transition-colors"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-earth/40 hover:bg-black/[0.05] transition-colors"
                aria-label="Clear"
              >
                <X size={15} strokeWidth={2.5} className="text-earth/40" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-5 sm:px-6">

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
              <div className="flex items-center gap-2 mb-3 px-4">
                <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                <p className="text-[14px] font-bold text-ink">
                  {t({ mn: "Онцлох бүтээгдэхүүн", en: "Featured products" })}
                </p>
              </div>

              <div className="native-scroll-x flex gap-4 pb-4 -mx-5 px-5">
                {featured.map((p) => {
                  const title = lang === "mn" ? p.name.mn : p.name.en;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => router.push(`/shop/${p._id}`)}
                      className="shrink-0 w-44 text-left flex flex-col gap-3 group"
                    >
                      <div className="relative w-full aspect-square bg-[#F2F2F7] rounded-[24px] flex items-center justify-center overflow-hidden border border-black/[0.04] transition-shadow group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] active:scale-[0.98]">
                        <ImageWithFallback
                          src={p.images?.[0]}
                          alt={title || "Product"}
                          fill
                          sizes="176px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col px-1">
                        <span className="text-[13px] text-earth line-clamp-1 font-medium">{title}</span>
                        <span className="font-bold text-[16px] text-ink mt-0.5">
                          ₮{Number(p.price ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product grid */}
          <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-5">
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
                  className="text-left flex flex-col gap-3 group"
                >
                  <div className="relative w-full aspect-square bg-[#F2F2F7] rounded-[24px] flex items-center justify-center overflow-hidden border border-black/[0.04] transition-shadow group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] active:scale-[0.98]">
                    <ImageWithFallback
                      src={img}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                    {outOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-bold tracking-widest text-white uppercase">
                          {t({ mn: "Дууссан", en: "Sold Out" })}
                        </span>
                      </div>
                    )}
                    {lowStock && (
                      <span className="absolute left-2 top-2 rounded-full bg-orange-100 px-2 py-1 text-[9px] font-bold tracking-widest text-orange-700 uppercase">
                        Үлдсэн: {p.stock}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col px-1">
                    <span className="text-[13px] text-earth line-clamp-2 leading-[1.3] font-medium">{title}</span>
                    <span className="font-bold text-[16px] text-ink mt-1">₮{Number(p.price ?? 0).toLocaleString()}</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
      </main>
    </div>
  );
}

