"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { Monk } from "@/database/types";
import MonkCard from "./MonkCard";
import {
  getCachedMonks,
  cacheMonks,
} from "@/app/capacitor/storage/offlineStorage";
import LargeHeader from "./LargeHeader";

export default function MonkShowcaseClient({
  initialMonks,
  hideHeader = false,
}: {
  initialMonks: Monk[];
  hideHeader?: boolean;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [monks, setMonks] = useState<Monk[]>(initialMonks || []);

  useEffect(() => {
    const refreshMonks = async () => {
      try {
        const cached = await getCachedMonks();
        if (cached && cached.length > 0) {
          setMonks(cached);
        }

        const res = await fetch("/api/monks");
        if (res.ok) {
          const freshData = await res.json();
          setMonks(freshData);
          await cacheMonks(freshData);
        }
      } catch (err) {
        console.warn("Background monk refresh failed", err);
      }
    };

    const run = () => refreshMonks();
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(run, 1);
    return () => clearTimeout(t);
  }, []);

  const filteredMonks = useMemo<Monk[]>(() => {
    const query = searchQuery.toLowerCase();
    // Sorting preferred names
    const preferredNames = [
      "Буянцог",
      "Ундраа",
      "Амина",
      "Доржбаатар",
      "Эрдэнэ",
      "Цэцэг",
    ];
    const getMonkRank = (m: Monk) => {
      const nameMn = m.name?.mn || "";
      const nameEn = m.name?.en || "";
      const index = preferredNames.findIndex(
        (p) =>
          nameMn.toLowerCase().includes(p.toLowerCase()) ||
          nameEn.toLowerCase().includes(p.toLowerCase()),
      );
      return index === -1 ? 999 : index;
    };

    const result = monks.filter((monk) => {
      if (monk.isAvailable === false && !hideHeader) return false;

      const matchesQuery =
        !query ||
        (monk.name?.mn || "").toLowerCase().includes(query) ||
        (monk.name?.en || "").toLowerCase().includes(query) ||
        monk.specialties?.some((s) => s.toLowerCase().includes(query));

      return matchesQuery;
    });

    // Sort by rank then by monkNumber
    return result.sort((a, b) => {
      const rankA = getMonkRank(a);
      const rankB = getMonkRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.monkNumber || 99) - (b.monkNumber || 99);
    });
  }, [searchQuery, hideHeader, monks]);

  const handleMonkClick = (monkId: string) => {
    const validLang = (["mn", "en"].includes(language) ? language : "mn") as
      | "mn"
      | "en";
    router.push(`/${validLang}/monks/${monkId}`);
  };

  return (
    <div
      className={hideHeader ? "" : "relative min-h-[100svh] bg-cream pb-24"}
      style={
        hideHeader
          ? {}
          : {
              paddingTop:
                "calc(var(--header-height-mobile) + env(safe-area-inset-top, 0px))",
            }
      }
    >
      {/* Header Area */}
      {!hideHeader && (
        <div className="sticky top-[calc(var(--header-height-mobile)+env(safe-area-inset-top,0px))] bg-white/85 backdrop-blur-md backdrop-saturate-150 z-30 border-b border-black/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <LargeHeader
            title={t({ mn: "Багш", en: "Mentors" })}
            highlight={t({ mn: "Нээлттэй", en: "Available" })}
            subtitle={t({
              mn: "Танд хамгийн зохицох багшийг хайж олоорой",
              en: "Find the right mentor for your journey",
            })}
            right={
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <Sparkles size={22} className="text-gold" strokeWidth={1.25} />
              </div>
            }
          />
          <div className="px-6 pb-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-earth/45"
                size={17}
                strokeWidth={1.35}
              />
              <input
                type="text"
                placeholder={t({
                  mn: "Нэр, чадвараар хайх...",
                  en: "Search by name or skill...",
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[20px] border-0 bg-[#F2F2F7] py-3.5 pl-11 pr-4 text-[16px] font-normal text-ink shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-shadow placeholder:text-earth/50 focus:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
              />
            </div>
          </div>
        </div>
      )}

      <div className={hideHeader ? "px-0" : "relative z-10 mt-6 px-5 pb-10"}>
        {filteredMonks.length > 0 ? (
          <>
          {!hideHeader && (
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-earth/50">
                  {t({ mn: "Удирдамж", en: "Guidance" })}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink tracking-tight">
                  {t({ mn: "Багш нар", en: "Mentors" })}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-black/[0.05] px-3 py-1 text-[12px] font-semibold tabular-nums text-earth">
                {filteredMonks.length}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            {filteredMonks.map((monk, index) => (
              <MonkCard
                key={monk._id?.toString()}
                monk={monk}
                index={index}
                onClick={() => handleMonkClick(monk._id?.toString() || "")}
              />
            ))}
          </div>
          </>
        ) : (
          <div
            className="anim-fade-up mx-auto max-w-md rounded-[20px] border border-black/[0.06] bg-white px-8 py-14 text-center shadow-sm"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.04]">
              <Search size={28} className="text-earth/45" strokeWidth={1.25} />
            </div>
            <h3 className="text-lg font-semibold text-ink tracking-tight">
              {t({ mn: "Илэрц олдсонгүй", en: "No mentors found" })}
            </h3>
            <p className="mt-2 text-[14px] text-earth/65">
              {t({
                mn: "Та хайлтаа өөрчлөөд үзээрэй.",
                en: "Try adjusting your search query.",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
