"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function monkId(m: HomeMonkItem): string {
  if (m._id == null) return "";
  return typeof m._id === "string" ? m._id : m._id.toString();
}

type Props = {
  locale: string;
  blogs: HomeBlogItem[];
  monks: HomeMonkItem[];
  featuredMonks: HomeMonkItem[];
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

export default function HomePage({
  locale,
  blogs,
  monks,
  featuredMonks,
}: Props) {
  const { language, t } = useLanguage();
  const lang = language === "mn" ? "mn" : "en";
  const latest = blogs[0];
  const monkCount = monks.length;

  const heroSlides = useMemo(
    () => buildHeroSlides(featuredMonks, monks, lang),
    [featuredMonks, monks, lang],
  );

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  const copy = {
    kicker: { mn: "онлайн засал - зөвлөгөө", en: "ONLINE GUIDANCE & CARE" },
    headline: {
      mn: "Сэтгэл зүй, засал, уламжлал",
      en: "Psychology, healing & tradition",
    },
    ctaPrimary: { mn: "Багш нар", en: "Teachers" },
    statsTeachers: { mn: "Багш", en: "Teachers" },
    statsRating: { mn: "Дундаж үнэлгээ", en: "Avg. rating" },
    statsSessions: { mn: "Засал", en: "Sessions" },
    sectionGuides: { mn: "Онцлох багш", en: "Featured guides" },
    sectionShortcuts: { mn: "Түргэн холбоос", en: "Shortcuts" },
    sectionStory: { mn: "Сүүлийн нийтлэл", en: "Latest story" },
    seeAll: { mn: "Бүгдийг үзэх", en: "See all" },
    read: { mn: "Унших", en: "Read" },
    emptyGuides: {
      mn: "Удахгүй багш нар нэмэгдэнэ.",
      en: "Teachers will appear here soon.",
    },
    emptyBlog: {
      mn: "Нийтлэл удахгүй орно.",
      en: "Stories are on the way.",
    },
  };

  const shortcuts = [
    {
      href: `/${locale}/sign-in`,
      icon: Users,
      label: { mn: "Нэвтрэх", en: "Sign in" },
    },
    {
      href: `/${locale}/monks`,
      icon: CalendarPlus,
      label: { mn: "Захиалах", en: "Book" },
    },
    {
      href: `/${locale}/messenger`,
      icon: MessageCircle,
      label: { mn: "Мессеж", en: "Messages" },
    },
    {
      href: `/${locale}/blog`,
      icon: Newspaper,
      label: { mn: "Блог", en: "Blog" },
    },
  ];

  const statCells = [
    {
      value: monkCount > 0 ? `${monkCount}+` : "—",
      label: t(copy.statsTeachers),
      Icon: Users,
    },
    { value: "5.0", label: t(copy.statsRating), Icon: Star },
    { value: "1200+", label: t(copy.statsSessions), Icon: Activity },
  ];

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-5 pb-32 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:pt-28 font-sans">
      {/* — Hero carousel (VCM-style) — */}
      <header className="mb-8 anim-fade-up">
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[20px] shadow-sm">
          {heroSlides.map((slide, i) => (
            <div
              key={`${slide.key}-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === heroIndex ? "opacity-100 z-0" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={i !== heroIndex}
            >
              {slide.src ? (
                <Image
                  src={slide.src}
                  alt={slide.alt || "Gevabal"}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 640px"
                  priority={i === 0}
                  unoptimized={
                    slide.src.startsWith("http") &&
                    !slide.src.includes("res.cloudinary.com")
                  }
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gradient-to-br from-[#2c2416] via-[#4a3d22] to-[#1a1510]"
                  aria-hidden
                />
              )}
            </div>
          ))}

          <div
            className="absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none"
            aria-hidden
          />

          <div className="absolute inset-0 z-[2] flex flex-col justify-end p-5 md:p-6 pointer-events-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/95 mb-2 drop-shadow-sm">
              {t(copy.kicker)}
            </p>
            <h1 className="text-[1.35rem] md:text-[1.5rem] font-bold leading-snug tracking-[-0.02em] text-white drop-shadow-md max-w-[95%]">
              {t(copy.headline)}
            </h1>
          </div>
        </div>

        {heroSlides.length > 1 ? (
          <div
            className="flex justify-center items-center gap-2 mt-4"
            role="tablist"
            aria-label="Hero"
          >
            {heroSlides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === heroIndex}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === heroIndex
                    ? "w-7 bg-gold shadow-[0_0_12px_rgba(255,230,160,0.85)]"
                    : "w-2 bg-black/18 hover:bg-black/28"
                }`}
                onClick={() => setHeroIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </header>

      {/* — Stats grid (VCM main sections) — */}
      <section className="grid grid-cols-3 gap-3 mb-12 anim-fade-up" style={{ animationDelay: "60ms" }}>
        {statCells.map((cell) => (
          <div
            key={cell.label}
            className="rounded-[20px] bg-white px-2 pt-4 pb-3 text-center shadow-sm border border-black/[0.04]"
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#48484a]">
              <cell.Icon size={20} strokeWidth={1.5} />
            </div>
            <div className="text-xl font-bold text-ink tabular-nums tracking-tight leading-none">
              {cell.value}
            </div>
            <div className="mt-1.5 text-[10px] font-medium text-text-light leading-tight px-0.5">
              {cell.label}
            </div>
          </div>
        ))}
      </section>

      {/* — Featured monks (compact horizontal carousel) — */}
      <section className="mb-12 anim-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-[1.25rem] font-bold text-ink tracking-tight">
            {t(copy.sectionGuides)}
          </h2>
          <Link
            href={`/${locale}/monks`}
            className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-gold-dark shrink-0"
          >
            {t(copy.seeAll)}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {featuredMonks.length === 0 ? (
          <div className="rounded-[20px] px-5 py-10 text-center bg-ios-grouped border border-black/[0.04] shadow-sm">
            <Sparkles
              className="w-7 h-7 text-gold mx-auto mb-2 drop-shadow-[0_0_8px_rgba(255,220,140,0.55)]"
              strokeWidth={1.5}
            />
            <p className="text-sm text-text-mid">{t(copy.emptyGuides)}</p>
            <Link
              href={`/${locale}/monks`}
              className="inline-flex mt-4 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              {t(copy.ctaPrimary)}
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory hide-scrollbar">
            {featuredMonks.map((m) => {
              const id = monkId(m);
              if (!id) return null;
              const name = pickTitle(m.name, lang);
              const href = `/${locale}/monks/${id}`;
              return (
                <Link
                  key={id}
                  href={href}
                  className="snap-start shrink-0 w-[152px] rounded-[20px] bg-white overflow-hidden shadow-sm border border-black/[0.05] active:scale-[0.99] transition-transform"
                >
                  <div className="relative aspect-[4/5] bg-ios-grouped overflow-hidden">
                    {m.image ? (
                      <Image
                        src={m.image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="152px"
                        unoptimized={
                          m.image.startsWith("http") &&
                          !m.image.includes("res.cloudinary.com")
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-black/15">
                        <Users className="w-9 h-9" strokeWidth={1.25} />
                      </div>
                    )}
                    {m.isAvailable !== false && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/95 px-2 py-0.5 text-[9px] font-semibold text-ink shadow-sm backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
                        {t({ mn: "Онлайн", en: "Live" })}
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[13px] font-bold text-ink leading-tight line-clamp-2 text-center">
                      {name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* — Shortcuts — */}
      <section className="mb-12 anim-fade-up" style={{ animationDelay: "140ms" }}>
        <h2 className="text-[1.125rem] font-bold text-ink tracking-tight mb-3">
          {t(copy.sectionShortcuts)}
        </h2>
        <div className="rounded-[20px] bg-white overflow-hidden divide-y divide-black/[0.06] shadow-sm border border-black/[0.04]">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03] transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-ink">
                <item.icon size={17} strokeWidth={1.5} />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-ink">
                {t(item.label)}
              </span>
              <ChevronRight className="w-4 h-4 text-text-light" />
            </Link>
          ))}
        </div>
      </section>

      {/* — Latest blog — */}
      <section className="anim-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[1.125rem] font-bold text-ink tracking-tight">
            {t(copy.sectionStory)}
          </h2>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-gold-dark"
          >
            {t(copy.seeAll)}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {!latest ? (
          <div className="rounded-[20px] bg-ios-grouped px-5 py-10 text-center text-[15px] text-text-mid border border-black/[0.04] shadow-sm">
            {t(copy.emptyBlog)}
          </div>
        ) : (
          <Link
            href={`/${locale}/blog/${latest.id}`}
            className="group block rounded-[20px] overflow-hidden bg-white shadow-sm border border-black/[0.05]"
          >
            <div className="relative aspect-[16/9] bg-ios-grouped overflow-hidden rounded-t-[20px]">
              {latest.cover ? (
                <Image
                  src={latest.cover}
                  alt={pickTitle(latest.title, lang)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width:768px) 100vw, 640px"
                  unoptimized={
                    latest.cover.startsWith("http") &&
                    !latest.cover.includes("res.cloudinary.com")
                  }
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-ios-grouped">
                  <Newspaper
                    className="w-11 h-11 text-black/12"
                    strokeWidth={1}
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/85 mb-1">
                  {formatBlogPostDate(latest.date, lang)}
                  {latest.category ? ` · ${latest.category}` : ""}
                </p>
                <h3 className="text-base font-bold text-white leading-snug tracking-tight line-clamp-2">
                  {pickTitle(latest.title, lang)}
                </h3>
                <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-white">
                  {t(copy.read)}
                  <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </div>
          </Link>
        )}
      </section>
    </div>
  );
}
