"use client";

import React from "react";
import { Calendar, Clock, Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface Booking {
  _id: string;
  clientName: string;
  userEmail?: string;
  userPhone?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "blocked";
  serviceName: { mn: string; en: string } | string;
  note?: string;
  price?: number;
}

interface DashboardBookingsProps {
  todayBookings: Booking[];
  upcomingBookings: Booking[];
  actionLoading: string | null;
  handleBookingAction: (id: string, status: string) => Promise<void>;
  locale: "mn" | "en";
}

const STATUS_MAP: Record<string, { label: { mn: string; en: string }; color: string }> = {
  pending:   { label: { mn: "Хүлээгдэж буй", en: "Pending" },   color: "bg-amber-100 text-amber-800 border-amber-300" },
  confirmed: { label: { mn: "Батлагдсан",    en: "Confirmed" }, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  completed: { label: { mn: "Дууссан",       en: "Completed" }, color: "bg-blue-100 text-blue-800 border-blue-300" },
  cancelled: { label: { mn: "Цуцлагдсан",   en: "Cancelled" }, color: "bg-red-100 text-red-800 border-red-300" },
  blocked:   { label: { mn: "Хаасан",        en: "Blocked" },   color: "bg-stone/40 text-earth border-stone" },
};

export default function DashboardBookings({
  todayBookings,
  upcomingBookings,
  actionLoading,
  handleBookingAction,
  locale
}: DashboardBookingsProps) {
  const { t } = useLanguage();

  const svcName = (sn: any) =>
    typeof sn === "string" ? sn : sn?.[locale] || sn?.mn || "Засал";

  return (
    <>
      {/* TODAY'S SCHEDULE */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
            <Calendar size={16} className="text-gold" />
            {t({ mn: "Өнөөдрийн хуваарь", en: "Today's Schedule" })}
          </h2>
          <span className="text-[12px] font-bold text-earth/50">
            {new Date().toLocaleDateString(locale === "mn" ? "mn-MN" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone/15">
            <Calendar size={32} className="text-earth/20 mx-auto mb-3" />
            <p className="text-[14px] text-earth/50 font-bold">{t({ mn: "Өнөөдөр захиалга алга", en: "No bookings today" })}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map(b => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl p-4 shadow-sm border border-stone/15"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-gold/10 rounded-xl px-3 py-2 text-center shrink-0">
                      <p className="text-[16px] font-semibold text-gold leading-none">{b.time}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{b.clientName}</p>
                      <p className="text-[11px] text-earth/60 truncate">{svcName(b.serviceName)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_MAP[b.status]?.color || ""}`}>
                      {STATUS_MAP[b.status]?.label?.[locale] || b.status}
                    </span>

                    {b.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleBookingAction(b._id, "confirmed")} disabled={actionLoading === b._id}
                          className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-90 transition-all">
                          {actionLoading === b._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </button>
                        <button onClick={() => handleBookingAction(b._id, "cancelled")} disabled={actionLoading === b._id}
                          className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center active:scale-90 transition-all">
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}

                    {b.status === "confirmed" && (
                      <button onClick={() => handleBookingAction(b._id, "completed")} disabled={actionLoading === b._id}
                        className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-[11px] font-semibold active:scale-95 transition-all flex items-center gap-1">
                        {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        {t({ mn: "Дуусгах", en: "Complete" })}
                      </button>
                    )}
                  </div>
                </div>

                {b.note && (
                  <p className="text-[12px] text-earth/60 bg-stone/10 rounded-xl px-3 py-2 mt-2 italic">"{b.note}"</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* UPCOMING BOOKINGS */}
      <section className="mb-6">
        <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-gold" />
          {t({ mn: "Ирэх 7 хоногийн захиалга", en: "Upcoming Bookings" })}
          {upcomingBookings.length > 0 && (
            <span className="bg-gold/10 text-gold text-[11px] font-semibold px-2 py-0.5 rounded-full">{upcomingBookings.length}</span>
          )}
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone/15">
            <Sparkles size={28} className="text-earth/20 mx-auto mb-2" />
            <p className="text-[13px] text-earth/50 font-bold">{t({ mn: "Ирэх 7 хоногт захиалга алга", en: "No upcoming bookings" })}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map(b => {
              const bookingDate = new Date(b.date);
              return (
                <div key={b._id} className="bg-white rounded-2xl px-4 py-3 border border-stone/15 flex items-center gap-3">
                  <div className="bg-cream rounded-xl p-2. text-center shrink-0 w-12">
                    <p className="text-[10px] font-bold text-earth/50 uppercase">
                      {bookingDate.toLocaleDateString(locale === "mn" ? "mn-MN" : "en-US", { weekday: "short" })}
                    </p>
                    <p className="text-[16px] font-semibold text-ink leading-none">{bookingDate.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{b.clientName}</p>
                    <p className="text-[11px] text-earth/50">{b.time} · {svcName(b.serviceName)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_MAP[b.status]?.color || ""}`}>
                    {STATUS_MAP[b.status]?.label?.[locale] || b.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
