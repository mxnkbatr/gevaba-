"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Plus, Sparkles, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

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

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export default function ProductClient({ product }: { product: Product | null }) {
  const { language: lang, t } = useLanguage();
  const { addToCart, totalItems } = useCart();
  const router = useRouter();
  const { isNative } = usePlatform();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTap = async () => {
    if (isNative) await hapticsLight();
  };

  const title = useMemo(() => {
    if (!product) return "";
    return (lang === "mn" ? product.name?.mn : product.name?.en) ?? product.name?.mn ?? product.name?.en ?? "—";
  }, [product, lang]);

  if (!product) {
    return (
      <div className="page flex flex-col items-center justify-center p-8 text-center">
        <h2 className="t-headline">{t({ mn: "Бараа олдсонгүй", en: "Product not found" })}</h2>
        <button onClick={() => router.back()} className="btn-primary mt-4 px-6">{t({ mn: "Буцах", en: "Go Back" })}</button>
      </div>
    );
  }

  const img = Array.isArray(product.images) ? product.images[0] : undefined;
  const desc = (lang === "mn" ? product.description?.mn : product.description?.en) ?? product.description?.mn ?? product.description?.en ?? "";
  const isSoldOut = typeof product.stock === "number" && product.stock !== -1 && product.stock <= 0;

  return (
    <div className={`page font-sans ${lang === "mn" ? "lang-mn" : ""}`}>
      
      {/* — TOP NAVIGATION BAR — */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ 
          height: "var(--nav-h)",
          backgroundColor: isScrolled ? "rgba(242,242,247,0.8)" : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled ? "0.5px solid var(--sep)" : "none",
          transition: "all 0.3s ease"
        }}
      >
        <button 
          onClick={() => { router.back(); handleTap(); }}
          className="btn-icon"
          style={{ width: "36px", height: "36px", background: isScrolled ? "transparent" : "rgba(255,255,255,0.8)", borderRadius: "12px" }}
        >
          <ChevronLeft size={24} color="var(--ink)" />
        </button>

        <LocalizedLink href="/shop/cart" onClick={handleTap}>
          <div className="relative btn-icon" style={{ width: "36px", height: "36px", background: isScrolled ? "transparent" : "rgba(255,255,255,0.8)", borderRadius: "12px" }}>
            <ShoppingBag size={20} color="var(--gold)" strokeWidth={2} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-sys-red border border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {totalItems}
              </span>
            )}
          </div>
        </LocalizedLink>
      </div>

      <div className="max-w-[480px] mx-auto w-full pb-32">
        
        {/* — PRODUCT HERO IMAGE — */}
        <div className="relative aspect-square w-full bg-bg-secondary overflow-hidden" style={{ borderRadius: "0 0 32px 32px" }}>
          {img ? (
            <Image
              src={img}
              alt={title}
              fill
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-5">
              <ShoppingBag size={80} strokeWidth={0.5} />
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-sm font-bold tracking-widest text-ink uppercase bg-white/90 px-4 py-2 rounded-xl shadow-lg">
                {t({ mn: "Дууссан", en: "Sold Out" })}
              </span>
            </div>
          )}
        </div>

        {/* — PRODUCT INFO — */}
        <div className="px-5 mt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-gold-dark opacity-80">
              {product.category || t({ mn: "Бараа", en: "Product" })}
            </span>
            <h1 className="text-[26px] font-bold leading-tight text-ink">
              {title}
            </h1>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[24px] font-black text-ink">
              ₮{Number(product.price ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink-3 mb-2">
              {t({ mn: "Тайлбар", en: "Description" })}
            </h3>
            <div className="card p-4">
              <p className="text-[16px] leading-relaxed text-ink-2 whitespace-pre-line">
                {desc || t({ mn: "Тайлбар оруулаагүй байна.", en: "No description available." })}
              </p>
            </div>
          </div>

          {/* — EXTRA INFO CARDS — */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="card p-3 flex flex-col items-center text-center gap-1">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                <Sparkles size={18} className="text-blue-500" />
              </div>
              <span className="text-[11px] font-bold text-ink-3 uppercase">{t({ mn: "Хүргэлт", en: "Delivery" })}</span>
              <span className="text-[13px] font-semibold text-ink">24-48 цаг</span>
            </div>
            <div className="card p-3 flex flex-col items-center text-center gap-1">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
                <ShoppingBag size={18} className="text-green-500" />
              </div>
              <span className="text-[11px] font-bold text-ink-3 uppercase">{t({ mn: "Төлөв", en: "Stock" })}</span>
              <span className="text-[13px] font-semibold text-ink">{isSoldOut ? t({ mn: "Дууссан", en: "Empty" }) : t({ mn: "Бэлэн", en: "In Stock" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* — BOTTOM ACTION BAR — */}
      {!isSoldOut && (
        <div 
          className="fixed left-0 right-0 z-50 px-6 py-4 pb-[calc(16px+env(safe-area-inset-bottom,34px))]"
          style={{ 
            bottom: "calc(49px + env(safe-area-inset-bottom, 34px))",
            background: "linear-gradient(to top, white 80%, rgba(255,255,255,0))",
            backdropFilter: "blur(4px)"
          }}
        >
          <div className="max-w-[432px] mx-auto flex gap-3">
            <button 
              onClick={() => { addToCart(product as any, 1); handleTap(); }}
              className="flex-1 btn-primary h-[54px] text-[17px] font-bold flex items-center justify-center gap-2"
              style={{ background: "var(--ink)", color: "white", borderRadius: "18px" }}
            >
              <Plus size={20} strokeWidth={3} />
              {t({ mn: "Сагсанд нэмэх", en: "Add to Cart" })}
            </button>
            <LocalizedLink href="/shop/cart" onClick={handleTap} className="shrink-0">
              <div 
                className="flex items-center justify-center h-[54px] w-[54px]"
                style={{ background: "var(--bg-secondary)", borderRadius: "18px", border: "0.5px solid var(--sep)" }}
              >
                <ShoppingBag size={22} color="var(--ink)" />
              </div>
            </LocalizedLink>
          </div>
        </div>
      )}
    </div>
  );
}

