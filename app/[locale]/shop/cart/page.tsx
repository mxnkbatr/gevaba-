"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useShopCart } from "@/app/hooks/useShopCart";
import { LocalizedLink } from "@/app/components/LocalizedLink";

type Product = {
  _id: string;
  name?: { mn?: string; en?: string };
  price?: number;
  images?: string[];
  stock?: number;
};

export default function ShopCartPage() {
  const { language: lang, t } = useLanguage();
  const { items, hydrated, setQuantity, remove, clear } = useShopCart();
  const router = useRouter();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/shop/products");
        const list: Product[] = res.ok ? await res.json() : [];
        if (cancelled) return;
        const map: Record<string, Product> = {};
        for (const p of list) map[p._id] = p;
        setProducts(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length, hydrated]);

  const rows = useMemo(() => {
    return items.map((it) => {
      const p = products[it.productId];
      return {
        ...it,
        product: p,
        title:
          (lang === "mn" ? p?.name?.mn : p?.name?.en) ??
          p?.name?.mn ??
          p?.name?.en ??
          t({ mn: "Бараа", en: "Product" }),
        price: Number(p?.price ?? 0),
        lineTotal: Number(p?.price ?? 0) * it.quantity,
      };
    });
  }, [items, products, lang]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + r.lineTotal, 0), [rows]);

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+88px)] pb-[calc(env(safe-area-inset-bottom,34px)+120px)]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
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
          <button
            type="button"
            onClick={() => clear()}
            className="rounded-full bg-white px-4 py-2.5 border border-black/[0.06] text-sm font-semibold text-earth"
            aria-label={t({ mn: "Цэвэрлэх", en: "Clear" })}
            disabled={items.length === 0}
          >
            {t({ mn: "Цэвэрлэх", en: "Clear" })}
          </button>
        </div>

        <div className="app-card-premium p-5 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-h2" style={{ fontFamily: "var(--font-display)" }}>
                {t({ mn: "Сагс", en: "Cart" })}
              </h1>
              <p className="text-secondary">
                {loading
                  ? t({ mn: "Ачаалж байна...", en: "Loading..." })
                  : t({ mn: "Төлбөрийг QPay-гаар хийнэ.", en: "Pay with QPay." })}
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="app-card-premium p-8 text-center">
            <p className="text-body">
              {t({ mn: "Таны сагс хоосон байна.", en: "Your cart is empty." })}
            </p>
            <div className="mt-4">
              <LocalizedLink href="/shop">
                <button type="button" className="btn-primary">
                  {t({ mn: "Дэлгүүр рүү", en: "Go to shop" })}
                </button>
              </LocalizedLink>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence>
                {rows.map((row) => (
                  <motion.div
                    key={row.productId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="app-card-premium p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink line-clamp-2">
                          {row.title}
                        </p>
                        <p className="text-secondary mt-1">
                          {row.price.toLocaleString()}₮
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(row.productId)}
                        className="h-10 w-10 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center text-earth"
                        aria-label={t({ mn: "Устгах", en: "Remove" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(row.productId, row.quantity - 1)}
                          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center"
                          aria-label={t({ mn: "Хасах", en: "Decrease" })}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-12 text-center font-black text-ink">
                          {row.quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuantity(row.productId, row.quantity + 1)}
                          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center"
                          aria-label={t({ mn: "Нэмэх", en: "Increase" })}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-label">{t({ mn: "Нийт", en: "Total" })}</p>
                        <p className="text-lg font-black text-ink">
                          {row.lineTotal.toLocaleString()}₮
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="app-card-premium p-5 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-secondary font-semibold">{t({ mn: "Нийт дүн", en: "Total" })}</p>
                <p className="text-2xl font-black text-ink">{total.toLocaleString()}₮</p>
              </div>
              <div className="mt-4">
                <LocalizedLink href="/shop/checkout">
                  <button type="button" className="btn-primary w-full h-12">
                    {t({ mn: "Төлөх", en: "Checkout" })}
                  </button>
                </LocalizedLink>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

