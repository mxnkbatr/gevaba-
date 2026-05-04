"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingBag, Plus } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { useCart } from "@/contexts/CartContext";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";
import LargeHeader from "@/app/components/LargeHeader";

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

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const { language: lang, t } = useLanguage();
  const { totalItems } = useCart();
  const { isNative } = usePlatform();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ["all", ...Array.from(cats)];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let result = initialProducts;
    
    if (activeCategory !== "all") {
      result = result.filter(p => p.category === activeCategory);
    }
    
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const mn = (p.name?.mn ?? "").toLowerCase();
        const en = (p.name?.en ?? "").toLowerCase();
        return mn.includes(q) || en.includes(q);
      });
    }
    return result;
  }, [initialProducts, query, activeCategory]);

  const handleTap = async () => {
    if (isNative) await hapticsLight();
  };

  const categoryLabels: Record<string, { mn: string, en: string }> = {
    all: { mn: "Бүгд", en: "All" },
    books: { mn: "Ном судар", en: "Books" },
    incense: { mn: "Хүж", en: "Incense" },
    statue: { mn: "Бурхан", en: "Statues" },
    rosary: { mn: "Эрих", en: "Rosaries" },
  };

  return (
    <div className={`page font-sans ${lang === "mn" ? "lang-mn" : ""}`}>
      <div className="max-w-[480px] mx-auto w-full pb-8">
        
        <div 
          className="sticky z-30 bg-bg-secondary/80 backdrop-blur-xl pb-4"
          style={{ 
            top: "var(--nav-h)",
            marginTop: "calc(var(--nav-h) * -1)",
            paddingTop: "var(--nav-h)"
          }}
        >
          <LargeHeader
            title={t({ mn: "Дэлгүүр", en: "Shop" })}
            subtitle={t({
              mn: "Тахилын хэрэглэл, ном судар, хүж",
              en: "Sacred items, books, and incense",
            })}
            omitNavGutter={true}
            right={
              <LocalizedLink href="/shop/cart" onClick={handleTap}>
                <div className="relative btn-icon" style={{ width: "42px", height: "42px", borderRadius: "14px" }}>
                  <ShoppingBag size={20} color="var(--gold)" strokeWidth={2} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sys-red border-2 border-white flex items-center justify-center text-[10px] font-bold text-white leading-none shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </div>
              </LocalizedLink>
            }
          />

          <div 
            style={{
              margin: "12px 16px 0",
              height: "38px",
              background: "rgba(118,118,128,0.12)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 10px",
              transition: "background 0.2s"
            }}
            className="focus-within:bg-[rgba(118,118,128,0.2)]"
          >
            <Search size={16} color="var(--ink-3)" strokeWidth={2.5} />
            <input
              type="text"
              placeholder={t({ mn: "Бараа хайх...", en: "Search products..." })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                flex: 1,
                fontSize: "16px",
                outline: "none",
                color: "var(--ink)",
                fontWeight: 400
              }}
              className="placeholder:text-[var(--ink-4)]"
            />
          </div>

          <div className="mt-4 px-4 overflow-x-auto hide-scrollbar flex gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const label = categoryLabels[cat] || { mn: cat, en: cat };
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); handleTap(); }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--r-pill)",
                    fontSize: "14px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    background: isActive ? "var(--gold)" : "white",
                    color: isActive ? "white" : "var(--ink-3)",
                    boxShadow: isActive ? "var(--depth-gold)" : "var(--depth-1)",
                    border: isActive ? "none" : "0.5px solid var(--sep)",
                    transition: "all 0.2s var(--spring)"
                  }}
                  className="active:scale-95"
                >
                  {t(label)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 mt-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const title = (lang === "mn" ? p.name?.mn : p.name?.en) ?? p.name?.mn ?? p.name?.en ?? "—";
                const img = Array.isArray(p.images) ? p.images[0] : undefined;
                const isSoldOut = typeof p.stock === "number" && p.stock !== -1 && p.stock <= 0;

                return (
                  <LocalizedLink
                    key={p._id}
                    href={`/shop/${p._id}`}
                    className="card active:scale-[0.975] transition-transform duration-200"
                    onClick={handleTap}
                  >
                    <div className="relative aspect-square overflow-hidden bg-bg-secondary">
                      {img ? (
                        <Image
                          src={img}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 480px) 50vw, 240px"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-ink-5">
                          <ShoppingBag size={40} strokeWidth={1} />
                        </div>
                      )}
                      
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[10px] font-bold tracking-widest text-ink uppercase bg-white/80 px-2 py-1 rounded">
                            {t({ mn: "Дууссан", en: "Sold Out" })}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 40%)" }} />
                    </div>

                    <div className="p-3">
                      <h3 className="text-[14px] font-semibold text-ink line-clamp-2 leading-tight min-h-[36px]">
                        {title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[15px] font-bold text-gold-dark">
                          ₮{Number(p.price ?? 0).toLocaleString()}
                        </span>
                        <div 
                          className="flex items-center justify-center active:scale-90 transition-transform"
                          style={{
                            width: "28px",
                            height: "28px",
                            background: "var(--gold)",
                            borderRadius: "8px",
                            boxShadow: "var(--depth-gold)",
                            color: "white"
                          }}
                        >
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-2xl flex items-center justify-center mb-4">
                <Search size={32} className="text-ink-5" />
              </div>
              <h3 className="t-headline">{t({ mn: "Бараа олдсонгүй", en: "No products found" })}</h3>
              <p className="t-subhead text-ink-3 mt-2">{t({ mn: "Та хайлтаа өөрчилнө үү.", en: "Try a different search query." })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
