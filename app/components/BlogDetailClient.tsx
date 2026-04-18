"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Bookmark, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { formatDate } from "@/app/lib/dateUtils";

interface BlogPost {
    _id: string;
    id: string;
    title: any;
    content: any;
    cover?: string;
    category?: string;
    date: string;
    authorName?: string;
}

const getLocalizedText = (field: any, lang: string) => {
    if (!field) return "";
    if (typeof field === 'string') return field;
    return field[lang] || field.mn || field.en || "";
};

const PLACEHOLDER_TITLE = { mn: "Өдрийн засал ба бясалгал", en: "Daily practice & meditation" };
const ACCENT = "var(--gold)";

export default function BlogDetailClient({ post, lang }: { post: any, lang: string }) {
    const { t } = useLanguage();

    if (!post) return null;

    const titleRaw = getLocalizedText(post.title, lang).trim();
    const title = titleRaw || t(PLACEHOLDER_TITLE);
    const content = getLocalizedText(post.content, lang);
    const cover = post.cover || null;
    const date = post.date ? formatDate(post.date, lang) : "";
    const author = post.authorName || "Багш";
    const category = post.category || "Wisdom";

    return (
        <div className="relative flex min-h-[100svh] flex-col bg-white antialiased selection:bg-neutral-200 selection:text-ink">
            <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: 14 }}>
                <div className="flex items-center justify-between px-5 max-w-2xl mx-auto w-full">
                    <Link href={`/${lang}/blog`} className="w-11 h-11 rounded-full bg-[#F2F2F7] border-0 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                        <ArrowLeft className="text-neutral-700" size={20} strokeWidth={1.25} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <button type="button" aria-label="Bookmark" className="w-11 h-11 rounded-full bg-[#F2F2F7] border-0 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                            <Bookmark size={18} className="text-neutral-600" strokeWidth={1.25} />
                        </button>
                        <button type="button" aria-label="Share" className="w-11 h-11 rounded-full bg-[#F2F2F7] border-0 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                            <Share2 size={18} className="text-neutral-600" strokeWidth={1.25} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 pb-[max(8rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+84px)]">
                <article className="mx-auto w-full max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Cover Image */}
                        {cover && (
                            <div className="px-5 mb-8">
                                <div className="relative aspect-video overflow-hidden rounded-[20px] bg-[#F2F2F2] border border-black/[0.05] shadow-sm">
                                    <img src={cover} alt={title} className="h-full w-full object-cover" />
                                </div>
                            </div>
                        )}

                        {/* Article Header */}
                        <div className="px-6 mb-10">
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2.5 py-1"
                                    style={{
                                        color: ACCENT,
                                        borderColor: "rgba(191, 164, 106, 0.38)",
                                        backgroundColor: "rgba(191, 164, 106, 0.1)",
                                    }}
                                >
                                    {category}
                                </span>
                                <span className="text-xs text-neutral-400">{date}</span>
                            </div>
                            <h1 className="mb-6 font-serif text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-ink md:text-[2.75rem] md:leading-[1.12]">
                                {title}
                            </h1>
                            <div className="flex items-center gap-4 py-6 border-y border-black/[0.06]">
                                <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] flex items-center justify-center text-lg font-semibold text-neutral-700 uppercase">
                                    {author.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-ink">{author}</p>
                                    <p className="text-xs text-neutral-400">Gevabal Guide</p>
                                </div>
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="px-6 prose prose-stone max-w-none">
                            <div className="text-[17px] md:text-[19px] text-ink/95 font-serif leading-[1.85] tracking-[-0.01em]">
                                {content.split('\n').map((line: string, i: number) => {
                                    const trimmed = line.trim();
                                    if (!trimmed) return null;
                                    return (
                                        <p key={i} className="mb-8">
                                            {trimmed}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Interactive End */}
                        <div className="px-6 mt-16 pt-10 border-t border-black/[0.06]">
                            <div className="rounded-[20px] border border-black/[0.06] bg-white p-8 text-center shadow-sm">
                                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F2F2F7] text-gold">
                                    <Navigation size={24} className="ml-0.5" strokeWidth={1.25} />
                                </div>
                                <h3 className="text-xl font-serif font-semibold text-ink mb-3 tracking-tight">
                                    {t({ mn: "Сургаалыг түгээх", en: "Share this teaching" })}
                                </h3>
                                <p className="text-[15px] text-neutral-500 mb-8 leading-relaxed">
                                    {t({ mn: "Оюун санааны гэрэл гэгээг бусдадаа хуваалцаарай.", en: "Pass on a moment of clarity to someone who needs it." })}
                                </p>
                                <button type="button" className="cta-button w-full min-h-[52px] shadow-gold active:scale-[0.98] transition-transform">
                                    {t({ mn: "Найзуудтайгаа хуваалцах", en: "Share with friends" })}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </article>
            </main>

            {/* Bottom Spacer */}
            <div style={{ height: "max(env(safe-area-inset-bottom), 12px)" }} className="bg-white shrink-0" />
        </div>
    );
}
