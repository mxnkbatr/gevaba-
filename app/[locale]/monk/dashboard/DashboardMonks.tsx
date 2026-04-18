"use client";

import React from "react";
import Image from "next/image";
import { 
  Power, Loader2, Lock, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface DashboardMonksProps {
  monkId: string;
  monkName: string;
  monkTitle: string;
  monkImage: string;
  isAvailable: boolean;
  availableToggling: boolean;
  toggleAvailable: () => Promise<void>;
  weekStart: Date;
  setWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[];
  actionLoading: string | null;
  handleBlockSlot: (date: string, time: string) => Promise<void>;
  locale: "mn" | "en";
}

const HOURS = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
const DAY_LABELS_MN = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(d: Date) { return d.toISOString().split("T")[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export default function DashboardMonks({
  monkId,
  monkName,
  monkTitle,
  monkImage,
  isAvailable,
  availableToggling,
  toggleAvailable,
  weekStart,
  setWeekStart,
  bookings,
  actionLoading,
  handleBlockSlot,
  locale
}: DashboardMonksProps) {
  const { t } = useLanguage();
  const today = toDateStr(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const DAY_LABELS = locale === "mn" ? DAY_LABELS_MN : DAY_LABELS_EN;

  const getBookingForSlot = (date: string, time: string) =>
    bookings.find(b => b.date === date && b.time === time && b.status !== "cancelled");

  return (
    <>
      {/* HEADER */}
      <header
        className="px-5 pb-5 bg-gradient-to-b from-white to-cream border-b border-stone/20"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 44px) + 12px)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-gold/30 shadow-sm relative">
              <Image
                src={monkImage || "/default-monk.jpg"}
                alt={monkName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-ink leading-tight">{monkName}</h1>
              {monkTitle && <p className="text-[12px] font-bold text-gold">{monkTitle}</p>}
            </div>
          </div>

          <button
            onClick={toggleAvailable}
            disabled={availableToggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[12px] transition-all active:scale-95 border ${
              isAvailable
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-stone/20 text-earth/60 border-stone/30"
            }`}
          >
            {availableToggling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Power size={14} className={isAvailable ? "text-emerald-500" : "text-earth/40"} />
            )}
            {isAvailable ? t({ mn: "Онлайн", en: "Online" }) : t({ mn: "Офлайн", en: "Offline" })}
          </button>
        </div>
      </header>

      {/* SCHEDULE MANAGEMENT */}
      <section className="px-5 pt-6 mb-6">
        <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 mb-3">
          <Lock size={16} className="text-gold" />
          {t({ mn: "Хуваарь удирдах", en: "Manage Schedule" })}
        </h2>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone/15">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setWeekStart(d => addDays(d, -7))}
              className="w-9 h-9 rounded-xl bg-stone/20 flex items-center justify-center active:scale-90 transition-all">
              <ChevronLeft size={18} className="text-earth" />
            </button>
            <span className="text-[13px] font-semibold text-ink">
              {weekStart.toLocaleDateString(locale === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric" })}
              {" — "}
              {addDays(weekStart, 6).toLocaleDateString(locale === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric" })}
            </span>
            <button onClick={() => setWeekStart(d => addDays(d, 7))}
              className="w-9 h-9 rounded-xl bg-stone/20 flex items-center justify-center active:scale-90 transition-all">
              <ChevronRight size={18} className="text-earth" />
            </button>
          </div>

          <div className="grid grid-cols-8 gap-0.5 mb-1">
            <div className="text-[10px] font-bold text-earth/40 text-right pr-1">{t({ mn: "Цаг", en: "Hr" })}</div>
            {weekDays.map((d, i) => {
              const ds = toDateStr(d);
              const isToday = ds === today;
              return (
                <div key={ds} className={`text-center py-1 rounded-lg ${isToday ? "bg-gold/10" : ""}`}>
                  <p className="text-[9px] font-bold text-earth/50 uppercase">{DAY_LABELS[i]}</p>
                  <p className={`text-[12px] font-semibold ${isToday ? "text-gold" : "text-ink"}`}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-0.5 mb-0.5">
                <div className="text-[10px] font-bold text-earth/30 text-right pr-1 pt-2">{hour}</div>
                {weekDays.map(d => {
                  const ds = toDateStr(d);
                  const booking = getBookingForSlot(ds, hour);
                  const isPast = ds < today;
                  const key = `${ds}_${hour}`;
                  const isLoading = actionLoading === key;

                  return (
                    <button
                      key={ds}
                      disabled={isPast || (!!booking && booking.status !== "blocked")}
                      onClick={() => !isPast && (!booking || booking.status === "blocked") && handleBlockSlot(ds, hour)}
                      className={`h-9 rounded-lg text-[9px] font-bold transition-all active:scale-90 ${
                        isPast
                          ? "bg-stone/10 cursor-not-allowed"
                          : !booking
                          ? "bg-stone/15 hover:bg-stone/30"
                          : booking.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : booking.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : booking.status === "blocked"
                          ? "bg-red-100 text-red-500"
                          : booking.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-stone/20"
                      }`}
                    >
                      {isLoading ? <Loader2 size={10} className="animate-spin mx-auto" /> :
                       booking?.status === "blocked" ? <Lock size={10} className="mx-auto" /> :
                       booking ? "●" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone/15">
            {[
              { c: "bg-stone/15", l: t({ mn: "Хоосон", en: "Free" }) },
              { c: "bg-amber-100", l: t({ mn: "Хүлээгдэж", en: "Pending" }) },
              { c: "bg-emerald-100", l: t({ mn: "Батлагдсан", en: "Confirmed" }) },
              { c: "bg-red-100", l: t({ mn: "Хаасан", en: "Blocked" }) },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${item.c}`} />
                <span className="text-[10px] font-bold text-earth/50">{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
