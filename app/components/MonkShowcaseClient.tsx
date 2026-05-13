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
    let cancelled = false;

    const refreshFromNetwork = async () => {
      try {
        const res = await fetch("/api/monks");
        if (!res.ok || cancelled) return;
        const freshData = await res.json();
        if (cancelled) return;
        setMonks(freshData);
        await cacheMonks(freshData);
      } catch (err) {
        console.warn("Background monk refresh failed", err);
      }
    };

    if (initialMonks?.length) {
      const run = () => {
        void refreshFromNetwork();
      };
      let idleId: number | undefined;
      let timeoutId: number | undefined;
      if (typeof requestIdleCallback !== "undefined") {
        idleId = requestIdleCallback(run, { timeout: 15000 });
      } else {
        timeoutId = window.setTimeout(run, 5000);
      }
      return () => {
        cancelled = true;
        if (idleId !== undefined) cancelIdleCallback(idleId);
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      };
    }

    const coldStart = async () => {
      try {
        const cached = await getCachedMonks();
        if (!cancelled && cached && cached.length > 0) {
          setMonks(cached);
        }
      } catch {
        /* ignore cache read errors */
      }
      await refreshFromNetwork();
    };

    const run = () => void coldStart();
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }
    const t = setTimeout(run, 1);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [initialMonks?.length]);

  const filteredMonks = useMemo<Monk[]>(() => {
    const query = searchQuery.toLowerCase();
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

  const langClass = language === "mn" ? "lang-mn" : "";

  return (
    <div className={hideHeader ? "" : `page font-sans ${langClass}`}>
      <div className={hideHeader ? "" : "max-w-[480px] mx-auto w-full pb-4"}>
        {!hideHeader && (
          <div 
            className="sticky z-30 bg-bg-secondary/80 backdrop-blur-xl pb-4"
            style={{ 
                top: "var(--nav-h)"
            }}
          >
            <LargeHeader
              title={t({ mn: "Багш", en: "Mentors" })}
              highlight={t({ mn: "Нээлттэй", en: "Available" })}
              subtitle={t({
                mn: "Танд хамгийн зохицох багшийг хайж олоорой",
                en: "Find the right mentor for your journey",
              })}
              omitNavGutter={true}
            />
            
            {/* SEARCH BAR — Apple HIG */}
            <div 
              style={{
                margin: "12px 16px 0",
                height: "44px",
                background: "rgba(0,0,0,0.04)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 14px",
                transition: "background 0.2s, box-shadow 0.2s"
              }}
              className="focus-within:bg-[rgba(0,0,0,0.06)]"
            >
              <Search
                size={18}
                color="rgba(60,60,67,0.4)"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder={t({
                  mn: "Нэр, чадвараар хайх...",
                  en: "Search by name or skill...",
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  flex: 1,
                  fontSize: "15px",
                  outline: "none",
                  color: "var(--ink)",
                  fontWeight: 400
                }}
                className="placeholder:text-[var(--ink-4)]"
              />
            </div>
          </div>
        )}

        <div className={hideHeader ? "px-0" : "px-4"}>
          {filteredMonks.length > 0 ? (
            <>
              {!hideHeader && (
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px", marginTop: "12px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)" }}>
                      {t({ mn: "Удирдамж", en: "Guidance" })}
                    </p>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.015em", marginTop: "2px" }}>
                      {t({ mn: "Багш нар", en: "Mentors" })}
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, background: "rgba(0,0,0,0.04)", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", color: "var(--ink-3)" }}>
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
              className="anim-1 card"
              style={{
                margin: "32px auto",
                maxWidth: "320px",
                padding: "32px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Search size={28} color="var(--ink-4)" strokeWidth={1.5} />
              </div>
              <h3 className="t-headline" style={{ color: "var(--ink)" }}>
                {t({ mn: "Илэрц олдсонгүй", en: "No mentors found" })}
              </h3>
              <p className="t-subhead" style={{ color: "var(--ink-3)", marginTop: "8px" }}>
                {t({
                  mn: "Та хайлтаа өөрчлөөд үзээрэй.",
                  en: "Try adjusting your search query.",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
