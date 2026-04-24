"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

export default function CartDrawer() {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { items, totalAmount, totalItems, updateQuantity, removeFromCart } = useCart();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("cart:open", onOpen as any);
    window.addEventListener("cart:close", onClose as any);
    return () => {
      window.removeEventListener("cart:open", onOpen as any);
      window.removeEventListener("cart:close", onClose as any);
    };
  }, []);

  const close = () => {
    setOpen(false);
  };

  const goCheckout = () => {
    close();
    router.push(`/shop/checkout`);
  };

  const rows = useMemo(() => {
    return items.map((it) => {
      const id = (it.product?._id ?? "").toString();
      const name = lang === "mn" ? it.product.name.mn : it.product.name.en;
      const price = Number(it.product.price ?? 0);
      const qty = Math.max(1, Number(it.quantity ?? 1));
      const img = it.product.images?.[0];
      return { id, name, price, qty, img };
    });
  }, [items, lang]);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          <motion.div
            className={`fixed left-0 right-0 bottom-0 z-[70] ${
              isDark ? "bg-[#1a1a1a] text-white" : "bg-white text-ink"
            } rounded-t-3xl shadow-2xl`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            }}
          >
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                    isDark ? "bg-white/10" : "bg-black/[0.04]"
                  }`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-h2" style={{ fontFamily: "var(--font-display)" }}>
                      {t({ mn: "Миний сагс", en: "My cart" })}
                    </p>
                    <p className={`text-[12px] font-semibold ${isDark ? "text-white/60" : "text-earth"}`}>
                      {totalItems > 0
                        ? t({ mn: `${totalItems} зүйл`, en: `${totalItems} items` })
                        : t({ mn: "Сагс хоосон байна", en: "Cart is empty" })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                    isDark ? "bg-white/10" : "bg-black/[0.04]"
                  }`}
                  aria-label={t({ mn: "Хаах", en: "Close" })}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="px-5 pb-6">
                <div className={`rounded-3xl p-8 text-center border ${
                  isDark ? "border-white/10 bg-white/5" : "border-black/[0.06] bg-black/[0.02]"
                }`}>
                  <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center bg-[var(--color-gold-muted)]">
                    <ShoppingBag className="w-7 h-7 text-[var(--color-gold-dark)]" />
                  </div>
                  <p className="text-body mt-4">
                    {t({ mn: "Сагс хоосон байна", en: "Your cart is empty" })}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 pb-4 max-h-[52svh] overflow-auto premium-scroll">
                  <div className="space-y-3">
                    {rows.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-3xl p-4 border ${
                          isDark ? "border-white/10 bg-white/5" : "border-black/[0.06] bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-ios-grouped shrink-0">
                              {r.img ? (
                                <Image
                                  src={r.img}
                                  alt={r.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{r.name}</p>
                              <p className={`text-xs font-black ${isDark ? "text-white/70" : "text-earth"}`}>
                                ₮{r.price.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(r.id)}
                            className="h-9 w-9 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center"
                            aria-label={t({ mn: "Устгах", en: "Remove" })}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(r.id, r.qty - 1)}
                              className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${
                                isDark ? "border-white/10 bg-white/5" : "border-black/[0.06] bg-white"
                              }`}
                              aria-label={t({ mn: "Хасах", en: "Decrease" })}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="w-10 text-center font-black">{r.qty}</div>
                            <button
                              type="button"
                              onClick={() => updateQuantity(r.id, r.qty + 1)}
                              className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${
                                isDark ? "border-white/10 bg-white/5" : "border-black/[0.06] bg-white"
                              }`}
                              aria-label={t({ mn: "Нэмэх", en: "Increase" })}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm font-black">
                            ₮{(r.price * r.qty).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 pt-4 border-t border-black/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <p className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-earth"}`}>
                      {t({ mn: "Нийт", en: "Total" })}
                    </p>
                    <p className="text-lg font-black text-[var(--color-gold-dark)]">
                      ₮{totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goCheckout}
                    className="btn-primary w-full h-12"
                  >
                    {t({ mn: "Захиалга өгөх", en: "Checkout" })}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

