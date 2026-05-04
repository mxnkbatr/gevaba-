"use client";

import React from "react";
import Image from "next/image";
import { Monk } from "@/database/types";
import { useLanguage } from "../contexts/LanguageContext";
import { Star, ArrowRight } from "lucide-react";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

interface MonkCardProps {
    monk: Monk;
    index?: number;
    onClick?: () => void;
}

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export default function MonkCard({ monk, index = 0, onClick }: MonkCardProps) {
    const { language: lang } = useLanguage();
    const { isNative } = usePlatform();
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

    const handleTap = async () => {
        if (isNative) {
            await hapticsLight();
        }
        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            onClick={handleTap}
            className="card mb-3 transition-all duration-200 active:scale-[0.975]"
            style={{
                padding: "12px",
                display: "flex",
                gap: "12px",
                cursor: "pointer",
                alignItems: "center"
            }}
        >
            {/* Avatar Block */}
            <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
                {isOnline && (
                    <div
                        className="aura-pulse"
                        style={{
                            position: "absolute",
                            inset: "2px",
                            borderRadius: "22px",
                            border: "1.5px solid var(--gold-glow)",
                            zIndex: 0
                        }}
                    />
                )}

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        borderRadius: "22px",
                        overflow: "hidden",
                        border: "0.5px solid rgba(0,0,0,0.08)",
                        boxShadow: "var(--depth-1)",
                        backgroundColor: "var(--bg-secondary)",
                        zIndex: 10
                    }}
                >
                    <Image
                        src={monk.image || "/default-monk.jpg"}
                        alt={name}
                        fill
                        priority={index < 3}
                        loading={index < 3 ? undefined : "lazy"}
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                    />
                </div>

                {isOnline && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "2px",
                            right: "2px",
                            width: "14px",
                            height: "14px",
                            background: "var(--sys-live)",
                            borderRadius: "50%",
                            border: "2.5px solid white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            zIndex: 20
                        }}
                    />
                )}
            </div>

            {/* Info Block */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <h3 className="t-headline truncate" style={{ color: "var(--ink)", fontSize: "17px" }}>
                            {name}
                        </h3>
                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: "1px" }} className="truncate">
                            {titleText}
                        </div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                        ₮{price}
                    </div>
                </div>

                <div style={{ fontSize: "13px", fontWeight: 400, color: "var(--ink-3)", marginTop: "4px" }} className="truncate">
                    {specialty} · {years}{validLang === "en" ? ` yrs` : " жил"}
                </div>

                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "1.5px" }}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={11}
                                className={i < Math.floor(Number(rating)) ? "text-gold fill-gold" : "text-ink-5 fill-ink-5"}
                                strokeWidth={0}
                            />
                        ))}
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{rating}</span>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--ink-4)" }}>({reviews})</span>
                </div>
            </div>

            {/* Right Action */}
            <div style={{ flexShrink: 0 }}>
                <div
                    className="flex items-center justify-center active:scale-[0.9] transition-all"
                    style={{
                        width: "36px",
                        height: "36px",
                        background: "var(--gold-muted)",
                        borderRadius: "12px",
                        color: "var(--gold-dark)",
                        transitionTimingFunction: "var(--spring)"
                    }}
                >
                    <ArrowRight size={18} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
