"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

type Product = {
  _id: string;
  name?: { mn?: string; en?: string };
  price?: number;
  images?: string[];
  stock?: number;
};

export default function ShopCartPage() {
  const { language: lang, t } = useLanguage();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const router = useRouter();
  const { isNative } = usePlatform();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTap = async () => {
    if (isNative) await hapticsLight();
  };

  useEffect(() => {
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
  }, [items.length]);

  const rows = useMemo(() => {
    return items.map((it) => {
      const p = products[it.productId];
      return {
        ...it,
        product: p,
        title: (lang === "mn" ? p?.name?.mn : p?.name?.en) ?? p?.name?.mn ?? p?.name?.en ?? t({ mn: "Бараа", en: "Product" }),
        price: Number(p?.price ?? 0),
        lineTotal: Number(p?.price ?? 0) * it.quantity,
      };
    });
  }, [items, products, lang]);

  const totalAmount = useMemo(() => rows.reduce((acc, r) => acc + r.lineTotal, 0), [rows]);

  return (
    <div className={`page font-sans ${lang === "mn" ? "lang-mn" : ""}`}>
      
      {/* — TOP NAVIGATION BAR — */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ 
          height: "var(--nav-h)",
          backgroundColor: "rgba(242,242,247,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "0.5px solid var(--sep)",
          transition: "all 0.3s ease"
        }}
      >
        <button 
          onClick={() => { router.back(); handleTap(); }}
          className="btn-icon"
          style={{ width: "36px", height: "36px", background: "transparent", borderRadius: "12px" }}
        >
          <ChevronLeft size={24} color="var(--ink)" />
        </button>

        <h1 className="text-[17px] font-bold text-ink">{t({ mn: "Сагс", en: "Cart" })}</h1>

        <button 
          onClick={() => { clearCart(); handleTap(); }}
          className="text-[15px] font-semibold text-sys-red px-2"
          disabled={items.length === 0}
        >
          {t({ mn: "Цэвэрлэх", en: "Clear" })}
        </button>
      </div>

      <div className="max-w-[480px] mx-auto w-full pb-32">
        <div className="px-5 pt-6">
          
          <div className="flex flex-col gap-1 mb-8">
            <h1 className="text-[34px] font-bold text-ink leading-tight">
              {t({ mn: "Сагс", en: "Cart" })}
            </h1>
            <p className="text-[15px] text-ink-3">
              {items.length > 0 
                ? t({ mn: `${totalItems} бараа байна`, en: `${totalItems} items in cart` })
                : t({ mn: "Сагс хоосон байна", en: "Your cart is empty" })}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={40} className="text-ink-5" />
              </div>
              <h3 className="t-headline">{t({ mn: "Сагс хоосон байна", en: "Empty Cart" })}</h3>
              <p className="t-subhead text-ink-3 mt-2">{t({ mn: "Та дэлгүүрээр зочлон бараа нэмээрэй.", en: "Go to shop and add some items." })}</p>
              <LocalizedLink href="/shop" onClick={handleTap} className="mt-8">
                <button className="btn-primary px-8 h-[50px]">{t({ mn: "Дэлгүүр рүү", en: "Back to Shop" })}</button>
              </LocalizedLink>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {rows.map((row) => (
                <div key={row.productId} className="card p-4 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-semibold text-ink line-clamp-2 leading-tight">
                        {row.title}
                      </h3>
                      <p className="text-[14px] font-bold text-gold-dark mt-1">
                        ₮{row.price.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => { removeFromCart(row.productId); handleTap(); }}
                      className="w-10 h-10 rounded-xl bg-sys-red/10 flex items-center justify-center text-sys-red active:scale-90 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-sep">
                    <div className="flex items-center gap-3 bg-bg-secondary p-1 rounded-2xl border border-sep">
                      <button 
                        onClick={() => { updateQuantity(row.productId, row.quantity - 1); handleTap(); }}
                        className="w-9 h-9 rounded-xl bg-white border border-sep shadow-sm flex items-center justify-center active:scale-90"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center font-bold text-[16px]">{row.quantity}</span>
                      <button 
                        onClick={() => { updateQuantity(row.productId, row.quantity + 1); handleTap(); }}
                        className="w-9 h-9 rounded-xl bg-white border border-sep shadow-sm flex items-center justify-center active:scale-90"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-bold text-ink-3 uppercase block leading-none">{t({ mn: "Нийт", en: "Line Total" })}</span>
                      <span className="text-[18px] font-black text-ink">₮{row.lineTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card p-5 mt-4 bg-ink text-white overflow-hidden relative">
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold uppercase tracking-widest opacity-60">{t({ mn: "Нийт дүн", en: "Total Amount" })}</span>
                    <span className="text-[28px] font-black">₮{totalAmount.toLocaleString()}</span>
                  </div>
                  <Sparkles size={24} className="text-gold" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* — BOTTOM CHECKOUT BAR — */}
      {items.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-[calc(16px+var(--sab))]"
          style={{ 
            background: "linear-gradient(to top, white 80%, rgba(255,255,255,0))",
            backdropFilter: "blur(4px)"
          }}
        >
          <LocalizedLink href="/shop/checkout" onClick={handleTap}>
            <button 
              className="w-full max-w-[432px] mx-auto btn-primary h-[54px] text-[17px] font-bold flex items-center justify-center gap-2"
              style={{ background: "var(--gold)", color: "white", borderRadius: "18px", boxShadow: "var(--depth-gold)" }}
            >
              {t({ mn: "Захиалах", en: "Checkout" })}
              <ChevronLeft size={20} strokeWidth={3} className="rotate-180" />
            </button>
          </LocalizedLink>
        </div>
      )}
    </div>
  );
}

