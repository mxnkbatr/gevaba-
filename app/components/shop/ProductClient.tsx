"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useShopCart } from "@/app/hooks/useShopCart";
import { LocalizedLink } from "@/app/components/LocalizedLink";

type Product = {
  _id: string;
  name?: { mn?: string; en?: string };
  description?: { mn?: string; en?: string };
  price?: number;
  images?: string[];
  stock?: number;
  category?: string;
  type?: "physical" | "digital";
};

export default function ProductClient({ product }: { product: Product | null }) {
  const { language: lang, t } = useLanguage();
  const { add, count } = useShopCart();
  const router = useRouter();

  const title = useMemo(() => {
    if (!product) return "";
    return (lang === "mn" ? product.name?.mn : product.name?.en) ?? product.name?.mn ?? product.name?.en ?? "—";
  }, [product, lang]);

  if (!product) {
    return (
      <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+88px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
        <div className="mx-auto w-full max-w-2xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white px-4 py-2.5 border border-black/[0.06] text-sm font-semibold"
            aria-label={t({ mn: "Буцах", en: "Back" })}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t({ mn: "Буцах", en: "Back" })}
            </span>
          </button>
          <div className="app-card-premium p-6 mt-4">
            <p className="text-h2">{t({ mn: "Бараа олдсонгүй", en: "Product not found" })}</p>
          </div>
        </div>
      </div>
    );
  }

  const img = Array.isArray(product.images) ? product.images[0] : undefined;
  const desc =
    (lang === "mn" ? product.description?.mn : product.description?.en) ??
    product.description?.mn ??
    product.description?.en ??
    "";
  const soldOut = typeof product.stock === "number" && product.stock !== -1 && product.stock <= 0;

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+88px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white px-4 py-2.5 border border-black/[0.06] text-sm font-semibold active:scale-[0.99] transition"
            aria-label={t({ mn: "Буцах", en: "Back" })}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t({ mn: "Буцах", en: "Back" })}
            </span>
          </button>

          <LocalizedLink
            href="/shop/cart"
            className="relative rounded-full bg-white px-4 py-2.5 border border-black/[0.06] text-sm font-semibold"
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-card-premium overflow-hidden"
        >
          <div className="relative aspect-[16/10] bg-ios-grouped">
            {img ? (
              <Image
                src={img}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-light text-sm">
                {t({ mn: "Зураггүй", en: "No image" })}
              </div>
            )}
            {soldOut && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-earth">
                  {t({ mn: "ДУУСCАН", en: "SOLD OUT" })}
                </span>
              </div>
            )}
          </div>

          <div className="p-6">
            <h1 className="text-h1" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h1>
            <p className="text-3xl font-black text-ink mt-3">
              {Number(product.price ?? 0).toLocaleString()}₮
            </p>
            {desc ? <p className="text-body mt-4 whitespace-pre-line">{desc}</p> : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => add(product._id, 1)}
                disabled={soldOut}
                className={`btn-primary flex-1 h-12 ${
                  soldOut ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t({ mn: "Сагсанд нэмэх", en: "Add to cart" })}
                </span>
              </button>
              <LocalizedLink href="/shop/cart" className="flex-1">
                <button type="button" className="btn-secondary w-full h-12">
                  {t({ mn: "Сагсаа үзэх", en: "View cart" })}
                </button>
              </LocalizedLink>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

