"use client";

import React from "react";
import Image from "next/image";
import { Monk } from "@/database/types";
import { useLanguage } from "../contexts/LanguageContext";
import { Star, ArrowRight } from "lucide-react";

interface MonkCardProps {
    monk: Monk;
    index?: number;
    onClick?: () => void;
}

export default function MonkCard({ monk, index = 0, onClick }: MonkCardProps) {
    const { language: lang } = useLanguage();
    const validLang = (['mn', 'en'].includes(lang) ? lang : 'mn') as 'mn' | 'en';

    const name = monk.name?.[validLang] || monk.name?.mn || monk.name?.en || "Unknown";
    const titleText = monk.title?.[validLang] || monk.title?.mn || monk.title?.en || "Үзмэрч";
    const years = monk.yearsOfExperience || 10;
    const price = (monk.services && monk.services[0]?.price) ? monk.services[0].price.toLocaleString() : "50,000";
    const isOnline = monk.isAvailable !== false;
    const rating = (monk as any).rating || "4.8";
    const reviews = (monk as any).reviews || 65;

    const specialty = Array.isArray(monk.specialties) && monk.specialties.length > 0
        ? monk.specialties[0]
        : (validLang === 'en' ? "Spiritual Guide" : "Засалч");

    return (
        <div
            onClick={onClick}
            className="app-card-premium group mb-5 flex cursor-pointer items-center gap-4 p-5 transition-all duration-300 active:scale-[0.98] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]"
        >
            {/* Avatar & Status */}
            <div className="relative w-20 h-20 flex-shrink-0">
                <div className={`absolute inset-0 rounded-full ${isOnline ? "aura-pulse" : "bg-stone/50"}`} />
                <div className="relative w-full h-full rounded-full overflow-hidden border border-white shadow-md z-10">
                    <Image
                        src={monk.image || "/default-monk.jpg"}
                        alt={name}
                        fill
                        priority={index < 3}
                        loading={index < 3 ? undefined : "lazy"}
                        className="object-cover"
                    />
                </div>
                {isOnline && (
                        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 shadow-sm backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-white/95">Online</span>
                        </div>
                    )}
            </div>

            {/* Info Container */}
            <div className="flex-1 min-w-0 pr-2 overflow-hidden">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-base font-semibold text-ink leading-tight truncate">{name}</h3>
                    <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-widest text-earth/50">{titleText}</p>
                </div>

                <p className="text-[11px] text-earth/60 mt-1 truncate">
                    {specialty} · {years}{validLang === "en" ? ` yrs` : " жил"}
                </p>

                <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center gap-1">
                        <Star size={10} className="text-gold fill-gold" strokeWidth={0} />
                        <span className="text-[11px] font-semibold text-ink">{rating}</span>
                        <span className="text-[10px] text-earth/40">({reviews})</span>
                    </div>
                </div>
            </div>

            {/* Right: Booking Focus */}
            <div className="flex flex-col items-end shrink-0">
                <p className="text-sm font-semibold text-ink mb-2">₮{price}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-gold text-neutral-900 shadow-sm">
                    <ArrowRight size={15} strokeWidth={1.75} />
                </div>
            </div>
        </div>
    );
}
