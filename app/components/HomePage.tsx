"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  MessageCircle,
  Newspaper,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { formatBlogPostDate } from "../lib/dateUtils";
import { LocalizedLink } from "./LocalizedLink";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

export type HomeBlogItem = {
  _id: string;
  id: string;
  title: { mn: string; en: string };
  date: string;
  cover: string;
  category: string;
  authorName: string;
};

export type HomeMonkItem = {
  _id?: string | { toString: () => string };
  name: { mn: string; en: string };
  title: { mn: string; en: string };
  image: string;
  rating?: string | number;
  isAvailable?: boolean;
};

export type HomeFeaturedProduct = {
  _id: string;
  name: { mn: string; en: string };
  price: number;
  images?: string[];
};

function monkId(m: HomeMonkItem): string {
  if (m._id == null) return "";
  return typeof m._id === "string" ? m._id : m._id.toString();
}

type Props = {
  locale: string;
  blogs: HomeBlogItem[];
  monks: HomeMonkItem[];
  featuredMonks: HomeMonkItem[];
  featuredProducts: HomeFeaturedProduct[];
};

function pickTitle(
  title: { mn: string; en: string },
  lang: "mn" | "en",
): string {
  const v = title[lang] || title.mn || title.en;
  return v || "";
}

type HeroSlide = { key: string; src: string | null; alt: string };

function buildHeroSlides(
  featuredMonks: HomeMonkItem[],
  monks: HomeMonkItem[],
  lang: "mn" | "en",
): HeroSlide[] {
  const raw: HeroSlide[] = [];
  const pool = featuredMonks.length ? featuredMonks : monks;
  for (const m of pool.slice(0, 6)) {
    const id = monkId(m);
    if (!id) continue;
    raw.push({
      key: id,
      src: m.image?.trim() ? m.image : null,
      alt: pickTitle(m.name, lang),
    });
  }
  if (raw.length === 0) {
    return [{ key: "hero-default", src: null, alt: "" }];
  }
  const out = [...raw];
  while (out.length < 3 && raw.length > 0) {
    const s = raw[out.length % raw.length];
    out.push({ ...s, key: `${s.key}-pad-${out.length}` });
  }
  return out;
}

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export default function HomePage({
  locale,
  blogs,
  monks,
  featuredMonks,
  featuredProducts,
}: Props) {
  const { language, t } = useLanguage();
  const lang = language === "mn" ? "mn" : "en";
  const { isNative } = usePlatform();
  const latest = blogs[0];
  const monkCount = monks.length;

  const heroSlides = useMemo(
    () => buildHeroSlides(featuredMonks, monks, lang),
    [featuredMonks, monks, lang],
  );

  const [heroIndex, setHeroIndex] = useState(0);
  const prevHeroIndexRef = useRef(0);

  const heroSlideIndicesToRender = useMemo(() => {
    const n = heroSlides.length;
    if (n <= 1) return [0];
    const prev = prevHeroIndexRef.current;
    return [
      ...new Set([
        heroIndex,
        (heroIndex - 1 + n) % n,
        (heroIndex + 1) % n,
        prev,
      ]),
    ];
  }, [heroIndex, heroSlides.length]);

  useEffect(() => {
    prevHeroIndexRef.current = heroIndex;
  }, [heroIndex]);

  useEffect(() => {
    setHeroIndex(0);
    prevHeroIndexRef.current = 0;
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('anim-visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleTap = async () => {
    if (isNative) await hapticsLight();
  };

  const copy = {
    kicker: { mn: "ОНЛАЙН ЗАСАЛ · ЗӨВЛӨГӨӨ", en: "ONLINE GUIDANCE & CARE" },
    headline: {
      mn: "Сэтгэл зүй, засал, уламжлал",
      en: "Psychology, healing & tradition",
    },
    ctaPrimary: { mn: "• Шууд нэвтрэлт", en: "• Direct access" },
    ctaSecondary: { mn: "Багш нар →", en: "Teachers →" },
    statsTeachers: { mn: "Багш", en: "Teachers" },
    statsRating: { mn: "Үнэлгээ", en: "Rating" },
    statsSessions: { mn: "Засал", en: "Sessions" },
    sectionGuides: { mn: "Онцлох багш", en: "Featured guides" },
    sectionStory: { mn: "Сүүлийн нийтлэл", en: "Latest story" },
    seeAll: { mn: "Бүгд ›", en: "See all ›" },
    read: { mn: "Унших →", en: "Read →" },
    emptyGuides: {
      mn: "Удахгүй багш нар нэмэгдэнэ.",
      en: "Teachers will appear here soon.",
    },
    emptyBlog: {
      mn: "Нийтлэл удахгүй орно.",
      en: "Stories are on the way.",
    },
    sectionShop: { mn: "Шидийн дэлгүүр", en: "Sacred Shop" },
    seeAllShop: { mn: "Бүгд ›", en: "See all ›" },
  };



  const statCells = [
    {
      value: monkCount > 0 ? `${monkCount}+` : "—",
      label: t(copy.statsTeachers),
      Icon: Users,
      bg: "rgba(175,82,222,0.12)",
      color: "#AF52DE",
    },
    {
      value: "5.0",
      label: t(copy.statsRating),
      Icon: Star,
      bg: "rgba(191,164,106,0.12)",
      color: "var(--gold)",
    },
    {
      value: "1.2к+",
      label: t(copy.statsSessions),
      Icon: Activity,
      bg: "rgba(52,199,89,0.18)",
      color: "#34C759",
    },
  ];

  const langClass = lang === "mn" ? "lang-mn" : "";

  return (
    <div className={`page font-sans ${langClass}`}>
      <div className="max-w-[480px] mx-auto w-full pb-[calc(var(--tab-h)+var(--sab)+20px)]">

        {/* — HERO CAROUSEL — */}
        <div className="mx-4 mb-5 anim-1">
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: "264px",
              borderRadius: "var(--r-3xl)",
              boxShadow: "var(--depth-hero)",
              clipPath: "border-box"
            }}
          >
            {/* Background layer */}
            <div
              className="absolute inset-0 z-0"
              style={{ background: "linear-gradient(145deg, #0C0B0E 0%, #1A1208 45%, #241A0E 80%, #0E0C08 100%)" }}
            />

            {/* SVG Mandala layer */}
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.08] pointer-events-none">
              <svg
                width="340" height="340" viewBox="0 0 100 100"
                className="spin-slow origin-center"
              >
                <circle cx="50" cy="50" r="40" stroke="var(--gold)" strokeWidth="0.5" fill="none" />
                <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="50" r="20" stroke="var(--gold)" strokeWidth="0.5" fill="none" />
              </svg>
            </div>

            {/* Images layer */}
            {heroSlideIndicesToRender.map((i) => {
              const slide = heroSlides[i];
              return (
                <div
                  key={`${slide.key}-${i}`}
                  className={`absolute inset-0 z-10 transition-opacity duration-700 ease-out mix-blend-screen ${i === heroIndex ? "opacity-40" : "opacity-0 pointer-events-none"
                    }`}
                >
                  {slide.src && (
                    <Image
                      src={slide.src}
                      alt={slide.alt || "Gevabal"}
                      fill
                      className="object-cover"
                      sizes="390px"
                      priority={i === 0 && heroIndex === 0}
                      fetchPriority={i === heroIndex ? "high" : "low"}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      unoptimized={
                        slide.src.startsWith("http") &&
                        !slide.src.includes("res.cloudinary.com")
                      }
                    />
                  )}
                </div>
              );
            })}

            {/* Gradient overlay layer */}
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(12,11,14,0.85) 0%, rgba(12,11,14,0.2) 60%, transparent 100%)" }}
            />

            {/* Content layer */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-[22px]">
              <p
                className="mb-2"
                style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(191,164,106,0.80)", textTransform: "uppercase" }}
              >
                {t(copy.kicker)}
              </p>
              <h1
                className="mb-4"
                style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#FFFFFF", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
              >
                {t(copy.headline)}
              </h1>
              <div className="flex gap-[10px]">
                <LocalizedLink href="/monks" onClick={handleTap}>
                  <button
                    className="flex items-center justify-center active:scale-[0.975] transition-transform duration-200"
                    style={{
                      background: "var(--gold)", color: "white", fontSize: "13px", fontWeight: 700,
                      padding: "9px 18px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(191,164,106,0.4)",
                      letterSpacing: "0.01em"
                    }}
                  >
                    {t(copy.ctaPrimary)}
                  </button>
                </LocalizedLink>
                <LocalizedLink href="/monks" onClick={handleTap} className="flex items-center active:opacity-70 transition-opacity">
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 600 }}>
                    {t(copy.ctaSecondary)}
                  </span>
                </LocalizedLink>
              </div>
            </div>

            {/* Slide indicators layer */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-[14px] right-[20px] z-30 flex gap-[5px]">
                {heroSlides.map((s, i) => (
                  <div
                    key={s.key}
                    style={{
                      height: "4px",
                      borderRadius: i === heroIndex ? "3px" : "50%",
                      width: i === heroIndex ? "22px" : "4px",
                      background: i === heroIndex ? "var(--gold)" : "rgba(255,255,255,0.45)",
                      transition: "width 0.3s var(--spring), background 0.3s"
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* — STATS ROW — */}
        <div
          className="mx-4 mt-5 mb-5"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}
        >
          {statCells.map((cell, idx) => (
            <div
              key={cell.label}
              className={`anim-${idx + 2} flex flex-col items-center gap-[6px]`}
              style={{
                background: "var(--bg-elevated)", borderRadius: "var(--r-xl)", boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
                border: "0.5px solid rgba(255,255,255,0.8)", padding: "14px 12px"
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: "36px", height: "36px", borderRadius: "var(--r-md)", background: cell.bg, color: cell.color }}
              >
                <cell.Icon size={18} strokeWidth={1.75} />
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>
                {cell.value}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--ink-3)", marginTop: "1px" }}>
                {cell.label}
              </div>
            </div>
          ))}
        </div>

        {/* — FEATURED MONKS — */}
        <div className="mb-5" data-reveal>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "24px 20px 12px" }}>
            <h2 className="t-title-3" style={{ color: "var(--ink)" }}>{t(copy.sectionGuides)}</h2>
            <LocalizedLink href="/monks" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-4)", letterSpacing: "-0.01em" }}>
              {t(copy.seeAll)}
            </LocalizedLink>
          </div>

          <div
            style={{ padding: "4px 20px 20px", display: "flex", gap: "12px", overflowX: "auto", scrollSnapType: "x mandatory" }}
            className="hide-scrollbar"
          >
            {featuredMonks.length === 0 ? (
              <div className="card w-full p-8 flex flex-col items-center justify-center">
                <Sparkles size={28} className="text-gold mb-2" />
                <p className="t-subhead text-ink-3">{t(copy.emptyGuides)}</p>
              </div>
            ) : (
              featuredMonks.map((m) => {
                const id = monkId(m);
                if (!id) return null;
                const name = pickTitle(m.name, lang);
                const titleText = pickTitle(m.title, lang) || "Үзмэрч";

                return (
                  <LocalizedLink
                    key={id}
                    href={`/monks/detail?id=${id}`}
                    className="card shrink-0 active:scale-[0.975] transition-transform duration-200"
                    style={{ width: "166px", scrollSnapAlign: "start" }}
                    onClick={handleTap}
                  >
                    <div style={{ height: "186px", position: "relative", overflow: "hidden" }}>
                      {m.image ? (
                        <Image
                          src={m.image}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="166px"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          unoptimized={
                            m.image.startsWith("http") &&
                            !m.image.includes("res.cloudinary.com")
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary-bg flex items-center justify-center">
                          <Users className="text-ink-3" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)" }} />

                      {m.isAvailable !== false && (
                        <div className="badge-live absolute" style={{ top: "8px", left: "8px" }}>
                          Онлайн
                        </div>
                      )}

                      <div className="absolute bottom-0 w-full" style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.015em", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }} className="truncate">
                          {name}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "2px" }} className="truncate">
                          {titleText}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "white", padding: "10px 12px" }}>
                      <div className="flex items-center gap-[4px]">
                        <Star size={11} className="fill-gold text-gold" strokeWidth={0} />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>5.0</span>
                        <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>(12)</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--gold-dark)", marginTop: "4px", textAlign: "right" }}>
                        ₮30,000
                      </div>
                    </div>
                  </LocalizedLink>
                )
              })
            )}
          </div>
        </div>

        {/* — SACRED SHOP — */}
        {featuredProducts?.length > 0 && (
          <div className="mb-5" data-reveal>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "24px 20px 12px" }}>
              <h2 className="t-title-3" style={{ color: "var(--ink)" }}>{t(copy.sectionShop)}</h2>
              <LocalizedLink href="/shop" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-4)", letterSpacing: "-0.01em" }}>
                {t(copy.seeAllShop)}
              </LocalizedLink>
            </div>

            <div
              style={{ padding: "4px 20px 20px", display: "flex", gap: "12px", overflowX: "auto", scrollSnapType: "x mandatory" }}
              className="hide-scrollbar"
            >
              {featuredProducts.slice(0, 4).map((p) => {
                const name = pickTitle(p.name, lang);
                const img = p.images?.[0] || "";
                return (
                  <LocalizedLink
                    key={p._id}
                    href={`/shop/product?id=${p._id}`}
                    className="card shrink-0 active:scale-[0.975] transition-transform duration-200"
                    style={{ width: "176px", scrollSnapAlign: "start", display: "flex", flexDirection: "column" }}
                    onClick={handleTap}
                  >
                    <div style={{ width: "100%", aspectRatio: "1/1", position: "relative" }}>
                      {img ? (
                        <Image
                          src={img}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="176px"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          unoptimized={
                            img.startsWith("http") && !img.includes("res.cloudinary.com")
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary-bg flex items-center justify-center">
                          <Sparkles className="text-ink-3" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.10) 0%, transparent 40%)" }} />
                    </div>
                    <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }} className="line-clamp-2 leading-snug">
                        {name}
                      </div>
                      <div className="flex justify-between items-center" style={{ marginTop: "8px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--gold-dark)" }}>
                          ₮{Number(p.price ?? 0).toLocaleString()}
                        </div>
                        <div style={{ width: "24px", height: "24px", background: "rgba(0,0,0,0.04)", borderRadius: "var(--r-full)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)" }}>
                          <ArrowRight size={14} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          </div>
        )}



        {/* — LATEST BLOG — */}
        <div className="mb-8" data-reveal>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 20px 16px" }}>
            <h2 className="t-title-3" style={{ color: "var(--ink)" }}>{t(copy.sectionStory)}</h2>
            <LocalizedLink href="/blog" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-4)", letterSpacing: "-0.01em" }}>
              {t(copy.seeAll)}
            </LocalizedLink>
          </div>

          {latest && (
            <LocalizedLink
              href={`/blog/post?id=${latest.id}`}
              className="card block active:scale-[0.975] transition-transform duration-200"
              style={{ margin: "0 16px", boxShadow: "var(--depth-3)" }}
              onClick={handleTap}
            >
              <div style={{ aspectRatio: "16/9", position: "relative" }}>
                {latest.cover ? (
                  <Image
                    src={latest.cover}
                    alt={pickTitle(latest.title, lang)}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 640px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized={
                      latest.cover.startsWith("http") &&
                      !latest.cover.includes("res.cloudinary.com")
                    }
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary-bg flex items-center justify-center">
                    <Newspaper className="text-ink-3" size={40} />
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }} />

                <div className="absolute bottom-0 w-full" style={{ padding: "24px 20px" }}>
                  <div style={{ display: "inline-flex", background: "rgba(191,164,106,0.9)", color: "white", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: "100px", marginBottom: "10px" }}>
                    {latest.category || "Нийтлэл"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "-0.015em", lineHeight: 1.3, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }} className="line-clamp-2">
                    {pickTitle(latest.title, lang)}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: "10px", display: "flex", gap: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <span>{formatBlogPostDate(latest.date, lang)}</span>
                    {latest.authorName && <span>· {latest.authorName}</span>}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold-light)", marginTop: "8px" }}>
                    {t(copy.read)}
                  </div>
                </div>
              </div>
            </LocalizedLink>
          )}
        </div>

      </div>
    </div>
  );
}
