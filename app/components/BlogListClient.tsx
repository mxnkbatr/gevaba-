"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search, X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";
import LargeHeader from "./LargeHeader";
import { formatDate } from "../lib/dateUtils";

const ACCENT = "var(--gold)";

type BlogCategory = "all" | "wisdom" | "news" | "meditation";

interface BlogPost {
  id: string;
  title: any;
  content: any;
  cover?: string;
  category?: string;
  date: string;
  authorName?: string;
}

const TRANSLATIONS = {
  badge: { mn: "Унших", en: "Read" },
  titleMain: { mn: "Блог &", en: "Blog &" },
  titleHighlight: { mn: "Мэдээ", en: "News" },
  searchPlaceholder: { mn: "Хайх", en: "Search" },
  noResults: { mn: "Нийтлэл олдсонгүй.", en: "No posts found." },
  readMore: { mn: "Унших", en: "Read" },
  all: { mn: "Бүгд", en: "All" },
  wisdom: { mn: "Сургаал", en: "Wisdom" },
  news: { mn: "Мэдээ", en: "News" },
  meditation: { mn: "Бясалгал", en: "Meditation" },
  featured: { mn: "ОНЦЛОХ", en: "FEATURED" },
};

const PLACEHOLDER_TITLE = {
  mn: "Өдрийн засал ба бясалгал",
  en: "Daily practice & meditation",
};

const getLocalizedText = (field: any, lang: string) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.mn || field.en || "";
};

const BlogCard = ({
  post,
  lang,
  idx,
  t,
}: {
  post: BlogPost;
  lang: "en" | "mn";
  idx: number;
  t: (x: { mn: string; en: string }) => string;
}) => {
  const rawTitle = getLocalizedText(post.title, lang).trim();
  const title = rawTitle || t(PLACEHOLDER_TITLE);
  const dateStr = formatDate(post.date, lang);
  const author = post.authorName || (lang === "mn" ? "Багш" : "Teacher");
  const categoryLabel = formatCategoryLabel((post.category || "").toString(), lang, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, ease: "easeOut" }}
      className="group block"
    >
      <Link
        href={`/${lang}/blog/${post.id}`}
        className="block overflow-hidden rounded-[20px] bg-white border border-black/[0.05] shadow-sm transition-shadow duration-300 hover:shadow-md active:scale-[0.99]"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-[#F2F2F7]">
          {post.cover ? (
            <Image
              src={post.cover}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 640px"
              unoptimized={
                post.cover.startsWith("http") &&
                !post.cover.includes("res.cloudinary.com")
              }
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
              <BookOpen size={36} strokeWidth={1.15} />
            </div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm backdrop-blur-md"
              style={{
                color: "var(--gold-dark)",
                borderColor: "rgba(191, 164, 106, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
              }}
            >
              {categoryLabel}
            </span>
          </div>
        </div>

        <div className="p-4 pt-5 pb-5">
          <h3 className="text-[17px] font-bold text-ink leading-snug line-clamp-2 tracking-tight">
            {title}
          </h3>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-earth/40">
            {author}
            <span className="mx-1.5 text-earth/20">·</span>
            {dateStr}
          </p>

          <div className="mt-4 flex items-center justify-end">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.04] bg-gold/15 text-gold-dark transition-transform group-active:scale-90 shadow-sm">
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

function normalizeCategoryKey(raw: string): BlogCategory | "general" | "unknown" {
  const v = raw.trim().toLowerCase();
  if (!v) return "unknown";

  // Canonical keys used by filters
  if (v === "all") return "all";
  if (v === "wisdom" || v === "сургаал") return "wisdom";
  if (v === "news" || v === "мэдээ") return "news";
  if (v === "meditation" || v === "бясалгал") return "meditation";

  // Common legacy / CMS values
  if (v === "general" || v === "энгийн" || v === "нийтлэл") return "general";

  return "unknown";
}

function formatCategoryLabel(
  raw: string,
  _lang: "en" | "mn",
  t: (x: { mn: string; en: string }) => string,
) {
  const key = normalizeCategoryKey(raw);

  if (key === "wisdom") return t(TRANSLATIONS.wisdom);
  if (key === "news") return t(TRANSLATIONS.news);
  if (key === "meditation") return t(TRANSLATIONS.meditation);

  if (key === "general") {
    return t({ mn: "Ерөнхий", en: "General" });
  }

  // Unknown / free-form categories: show as Title Case (avoid screaming ALL CAPS)
  const cleaned = raw.trim();
  if (!cleaned) return t({ mn: "Нийтлэл", en: "Post" });
  return cleaned
    .toLowerCase()
    .split(/\s+/g)
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function matchesCategory(post: BlogPost, filter: BlogCategory) {
  if (filter === "all") return true;
  if (!post.category) return false;

  const key = normalizeCategoryKey(post.category.toString());
  if (key === "unknown") {
    return post.category.toLowerCase() === filter;
  }

  // Legacy CMS often uses "General" — treat it as broadly relevant so it doesn't "disappear"
  // when users pick a category chip (better UX than hiding it behind only "Бүгд").
  if (key === "general") {
    return true;
  }

  return key === filter;
}

export default function BlogListClient({
  initialPosts,
}: {
  initialPosts: BlogPost[];
}) {
  const { language, t } = useLanguage();
  const lang = language === "mn" ? "mn" : "en";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BlogCategory>("all");

  const filteredPosts = useMemo(
    () =>
      initialPosts.filter((post) => {
        const title = getLocalizedText(post.title, lang).toLowerCase();
        const content = getLocalizedText(post.content, lang).toLowerCase();
        const q = search.toLowerCase();
        const matchesSearch =
          title.includes(q) || content.includes(q);
        const matchesFilter = matchesCategory(post, filter);
        return matchesSearch && matchesFilter;
      }),
    [initialPosts, search, filter, lang],
  );

  return (
    <div className="relative min-h-[100svh] flex flex-col bg-white pb-24 pt-[calc(56px+env(safe-area-inset-top,0px))] md:pt-[88px]">
      <header className="sticky z-30 border-b border-black/[0.06] bg-[rgba(248,248,250,0.85)] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_0_rgba(0,0,0,0.03)] top-[calc(56px+env(safe-area-inset-top,0px))] md:top-[80px]">
        <LargeHeader
          omitNavGutter
          title={t(TRANSLATIONS.titleMain)}
          highlight={t(TRANSLATIONS.titleHighlight)}
          subtitle={t({
            mn: "Сургаал, мэдээ, бясалгалын нийтлэлүүд",
            en: "Wisdom, news and meditation posts",
          })}
        />

        <div className="space-y-3 px-5 pb-4 md:px-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {(["all", "wisdom", "news", "meditation"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                type="button"
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-all border ${
                  filter === cat
                    ? "border-gold/45 bg-[#F2F2F7] text-gold"
                    : "border-transparent bg-[#F2F2F7] text-neutral-600 hover:bg-neutral-200/80 hover:text-ink"
                }`}
              >
                {t(TRANSLATIONS[cat])}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-earth/30"
              size={15}
              strokeWidth={2.5}
            />
            <input
              type="search"
              placeholder={t(TRANSLATIONS.searchPlaceholder)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[16px] border-0 bg-black/[0.04] py-2.5 pl-9 pr-10 text-[15px] font-medium text-ink outline-none ring-0 placeholder:text-earth/40 focus:bg-black/[0.06] transition-colors"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-earth/40 hover:bg-black/[0.05] transition-colors"
                aria-label="Clear"
              >
                <X size={15} strokeWidth={2.5} className="text-earth/40" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-5 sm:px-6">
        <AnimatePresence mode="wait">
          {filteredPosts.length > 0 ? (
            <>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {t({ mn: "Нийтлэл", en: "Editorial" })}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink tracking-tight">
                    {t({
                      mn: "Сонгосон нийтлэлүүд",
                      en: "Curated readings",
                    })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F2F2F7] px-3 py-1 text-[12px] font-semibold tabular-nums text-neutral-600">
                  {filteredPosts.length}
                </span>
              </div>
              <motion.div
                key={`${filter}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredPosts.map((post: BlogPost, idx: number) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    lang={lang}
                    idx={idx}
                    t={t}
                  />
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto flex max-w-md flex-col items-center rounded-[20px] border border-black/[0.06] bg-white px-8 py-16 text-center shadow-sm"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F2F7]">
                <Sparkles
                  size={28}
                  className="text-neutral-400"
                  strokeWidth={1.25}
                />
              </div>
              <p className="text-lg font-semibold text-ink">
                {t(TRANSLATIONS.noResults)}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {t({
                  mn: "Шүүлтүүр эсвэл хайлтаа өөрчлөөд үзнэ үү",
                  en: "Try another category or search term.",
                })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
