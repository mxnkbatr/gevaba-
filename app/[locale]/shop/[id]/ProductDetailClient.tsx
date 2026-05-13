"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

/** Resilient image — shows Buddhist placeholder on error or missing src */
function ImageWithFallback({
  src,
  alt,
  ...props
}: React.ComponentProps<typeof Image>) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F2E8] gap-2">
        <span style={{ fontSize: 48, lineHeight: 1 }}>☸️</span>
        <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 600, letterSpacing: "0.04em" }}>
          {alt}
        </span>
      </div>
    );
  }
  return <Image src={src} alt={alt} {...props} onError={() => setErrored(true)} />;
}

type ShopProduct = {
  _id: string;
  name: { mn: string; en: string };
  description: { mn: string; en: string };
  price: number;
  images: string[];
  category: string;
  stock: number; // -1 unlimited
  isFeatured: boolean;
  type: "physical" | "digital";
};

function categoryLabel(category: string, lang: "mn" | "en") {
  const map: Record<string, { mn: string; en: string }> = {
    sutra: { mn: "Ном судар", en: "Sutra" },
    incense: { mn: "Хүж", en: "Incense" },
    statue: { mn: "Бурхан", en: "Statue" },
    mala: { mn: "Эрих", en: "Mala" },
    ritual: { mn: "Тахил", en: "Ritual" },
    blessing: { mn: "Адислал", en: "Blessing" },
    other: { mn: "Бусад", en: "Other" },
  };
  return (map[category] ?? map.other)[lang];
}

export default function ProductDetailClient({ product }: { product: ShopProduct | null }) {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { addToCart, totalItems } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center"
          aria-label={t({ mn: "Буцах", en: "Back" })}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="app-card-premium p-8 mt-4 text-center">
          <p className="text-h2">{t({ mn: "Бүтээгдэхүүн олдсонгүй", en: "Product not found" })}</p>
        </div>
      </div>
    );
  }

  const title = lang === "mn" ? product.name.mn : product.name.en;
  const images = Array.isArray(product.images) ? product.images : [];
  const mainImg = images[activeImage] ?? images[0];
  const outOfStock = product.stock === 0;
  const maxQty = product.stock === -1 ? 10 : Math.min(Math.max(1, product.stock), 10);

  const desc = lang === "mn" ? product.description?.mn : product.description?.en;
  const longDesc = (desc ?? "").length > 240;
  const displayDesc = expanded || !longDesc ? desc : `${(desc ?? "").slice(0, 240)}…`;

  const openDrawer = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("cart:open"));
  };

  const add = (goCheckout = false) => {
    addToCart({ ...(product as any), _id: product._id }, qty);
    toast.success(t({ mn: "Сагсанд нэмлээ", en: "Added to cart" }));
    if (goCheckout) router.push(`/shop/checkout`);
  };

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+120px)]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-[0.99] transition"
            aria-label={t({ mn: "Буцах", en: "Back" })}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Main image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-ios-grouped">
            <ImageWithFallback
              src={mainImg}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority={activeImage === 0}
            />
            {outOfStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-earth">
                  {t({ mn: "ДУУСCАН", en: "SOLD OUT" })}
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((src, idx) => (
                <button
                  key={src + idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 rounded-2xl overflow-hidden border ${
                    idx === activeImage ? "border-[var(--color-gold)]" : "border-black/[0.06]"
                  }`}
                  aria-label={t({ mn: "Зураг сонгох", en: "Select image" })}
                >
                  <ImageWithFallback src={src} alt={title} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product info */}
          <div className="app-card-premium p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--color-gold-muted)] text-[var(--color-gold-dark)]">
                {categoryLabel(product.category, lang)}
              </span>
              {product.type === "digital" && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700">
                  📱 {t({ mn: "Дижитал бүтээгдэхүүн", en: "Digital" })}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-serif font-semibold tracking-tight">
              {title}
            </h1>

            <p className="mt-3 text-2xl font-black text-[var(--color-gold)]">
              ₮{Number(product.price ?? 0).toLocaleString()}
            </p>

            {/* Description */}
            {desc ? (
              <div className="mt-4">
                <p className="text-body whitespace-pre-line">{displayDesc}</p>
                {longDesc && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 text-xs font-bold text-[var(--color-gold-dark)]"
                  >
                    {expanded
                      ? t({ mn: "Хураах", en: "Show less" })
                      : t({ mn: "Дэлгэрэнгүй", en: "Show more" })}
                  </button>
                )}
              </div>
            ) : null}

            {/* Quantity selector */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-secondary font-semibold">
                {t({ mn: "Тоо хэмжээ", en: "Quantity" })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center"
                  disabled={outOfStock}
                  aria-label={t({ mn: "Хасах", en: "Decrease" })}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 text-center font-black text-ink">{qty}</div>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center"
                  disabled={outOfStock}
                  aria-label={t({ mn: "Нэмэх", en: "Increase" })}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky actions - positioned above the bottom tab bar */}
      <div 
        className="fixed left-0 right-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom,34px)+16px)] pt-4 bg-white/90 backdrop-blur-2xl border-t border-black/[0.06] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
        style={{ bottom: "calc(49px + env(safe-area-inset-bottom, 34px))" }}
      >
        <div className="mx-auto w-full max-w-3xl grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => add(false)}
            disabled={outOfStock}
            className={`btn-secondary h-12 ${outOfStock ? "opacity-60 pointer-events-none" : ""}`}
          >
            {t({ mn: "Сагслах", en: "Add to cart" })}
          </button>
          <button
            type="button"
            onClick={() => add(true)}
            disabled={outOfStock}
            className={`btn-primary h-12 ${outOfStock ? "opacity-60 pointer-events-none" : ""}`}
          >
            {t({ mn: "Шууд авах", en: "Buy now" })}
          </button>
        </div>
      </div>
    </div>
  );
}

