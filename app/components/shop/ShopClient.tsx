"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { useShopCart } from "@/app/hooks/useShopCart";

type Product = {
  _id: string;
  name?: { mn?: string; en?: string };
  price?: number;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  category?: string;
  type?: "physical" | "digital";
};

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const { language: lang, t } = useLanguage();
  const { count, add } = useShopCart();
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialProducts;
    return initialProducts.filter((p) => {
      const mn = (p.name?.mn ?? "").toLowerCase();
      const en = (p.name?.en ?? "").toLowerCase();
      return mn.includes(q) || en.includes(q);
    });
  }, [initialProducts, query]);

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+88px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)] md:pt-32 md:pb-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-700" />
              </div>
              <h1 className="text-h1" style={{ fontFamily: "var(--font-display)" }}>
                {t({ mn: "Дэлгүүр", en: "Shop" })}
              </h1>
            </div>
            <p className="text-secondary mt-2">
              {t({
                mn: "Захиалгаа QPay-гаар төлөөд баталгаажуулна.",
                en: "Pay securely with QPay to confirm your order.",
              })}
            </p>
          </div>

          <LocalizedLink
            href="/shop/cart"
            className="relative rounded-full bg-white px-4 py-2.5 border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-sm font-semibold text-ink active:scale-[0.99] transition"
            aria-label={t({ mn: "Сагс", en: "Cart" })}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {t({ mn: "Сагс", en: "Cart" })}
            </span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">
                {count}
              </span>
            )}
          </LocalizedLink>
        </div>

        <div className="app-card-premium p-4 md:p-5 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ mn: "Бараа хайх...", en: "Search products..." })}
            className="w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(191,164,106,0.25)]"
          />
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {products.map((p) => {
              const title = (lang === "mn" ? p.name?.mn : p.name?.en) ?? p.name?.mn ?? p.name?.en ?? "—";
              const img = Array.isArray(p.images) ? p.images[0] : undefined;
              const disabled = typeof p.stock === "number" && p.stock !== -1 && p.stock <= 0;

              return (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="app-card-premium"
                >
                  <LocalizedLink href={`/shop/${p._id}`} className="block">
                    <div className="relative aspect-[4/3] bg-ios-grouped">
                      {img ? (
                        <Image
                          src={img}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-light text-sm">
                          {t({ mn: "Зураггүй", en: "No image" })}
                        </div>
                      )}
                      {disabled && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[11px] font-black uppercase tracking-widest text-earth">
                            {t({ mn: "ДУУСCАН", en: "SOLD OUT" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </LocalizedLink>

                  <div className="p-4">
                    <div className="min-h-[44px]">
                      <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">
                        {title}
                      </p>
                    </div>
                    <div className="flex items-end justify-between gap-3 mt-3">
                      <div className="min-w-0">
                        <p className="text-label">
                          {t({ mn: "Үнэ", en: "Price" })}
                        </p>
                        <p className="text-lg font-black text-ink">
                          {Number(p.price ?? 0).toLocaleString()}₮
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => add(p._id, 1)}
                        disabled={disabled}
                        className={`h-11 w-11 rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-[0.99] transition ${
                          disabled ? "bg-black/5 text-black/30" : "bg-white text-ink hover:bg-black/[0.03]"
                        }`}
                        aria-label={t({ mn: "Сагсанд нэмэх", en: "Add to cart" })}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

