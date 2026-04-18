"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, CheckCircle, XCircle, TrendingUp,
  Lock, Unlock, ChevronLeft, ChevronRight, Loader2, AlertCircle
} from "lucide-react";
import Image from "next/image";

interface Booking {
  _id: string;
  clientName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "blocked";
  serviceName: { mn: string; en: string };
  note?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800 border border-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  completed: "bg-blue-100 text-blue-800 border border-blue-300",
  cancelled: "bg-red-100 text-red-800 border border-red-300",
  blocked:   "bg-stone/40 text-earth border border-stone",
};

const HOURS = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function MonkSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "week" | "earnings">("today");
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // This Monday
    return d;
  });

  const today = toDateStr(new Date());

  useEffect(() => {
    if (!authLoading && user && user.role !== "monk" && user.role !== "admin") {
      router.push(`/${language}`);
    }
  }, [authLoading, user, language, router]);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?monkId=${user._id || user.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const handleStatusChange = async (bookingId: string, status: "confirmed" | "rejected") => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: status === "rejected" ? "cancelled" : status } : b));
      }
    } catch (e) {
      console.error("Status update failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockSlot = async (date: string, time: string) => {
    const key = `${date}_${time}`;
    setActionLoading(key);
    try {
      // Check if it's already blocked
      const existingBlock = bookings.find(b => b.date === date && b.time === time && b.status === "blocked");
      if (existingBlock) {
        // Unblock
        await fetch(`/api/bookings/${existingBlock._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        setBookings(prev => prev.filter(b => b._id !== existingBlock._id));
      } else {
        // Block
        const res = await fetch("/api/bookings/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, time }),
        });
        if (res.ok) {
          const newBlock = await res.json();
          setBookings(prev => [...prev, { ...newBlock, status: "blocked", clientName: "Blocked", serviceName: { mn: "Хааснаар", en: "Blocked" } }]);
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  // --- Derived State ---
  const todayBookings = bookings.filter(b => b.date === today && b.status !== "cancelled");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBookingForSlot = (date: string, time: string) =>
    bookings.find(b => b.date === date && b.time === time && b.status !== "cancelled");

  // Earnings this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthEarnings = bookings
    .filter(b => b.status === "completed" && b.date.startsWith(thisMonth))
    .length * 40000;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header
        className="px-5 pb-4 bg-white/90 backdrop-blur-md border-b border-stone/30 sticky top-0 z-20"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 44px) + 10px)" }}
      >
        <h1 className="text-[24px] font-semibold text-ink mb-4">
          {t({ mn: "Миний хуваарь", en: "My Schedule" })}
        </h1>
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-stone/30 rounded-2xl">
          {(["today", "week", "earnings"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === tab ? "bg-white text-ink shadow-sm" : "text-earth/60"
              }`}
            >
              {tab === "today" ? t({ mn: "Өнөөдөр", en: "Today" }) :
               tab === "week"  ? t({ mn: "7 хоног", en: "Week" }) :
                                 t({ mn: "Орлого", en: "Earnings" })}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 py-6 pb-32">
        <AnimatePresence mode="wait">

          {/* TODAY VIEW */}
          {activeTab === "today" && (
            <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[13px] font-bold text-earth/60 mb-4 uppercase tracking-widest">
                {new Date().toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>

              {todayBookings.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar size={40} className="text-earth/30 mx-auto mb-4" />
                  <p className="text-earth/50 font-bold">{t({ mn: "Өнөөдөр захиалга алга", en: "No bookings today" })}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.sort((a, b) => a.time.localeCompare(b.time)).map(booking => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-stone/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-gold" />
                            <span className="text-[15px] font-semibold text-ink">{booking.time}</span>
                          </div>
                          <p className="text-[16px] font-semibold text-ink">{booking.clientName}</p>
                          <p className="text-[12px] text-earth/60">{booking.serviceName?.[language as "mn" | "en"] || booking.serviceName?.mn}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[booking.status]}`}>
                          {booking.status === "pending"   ? t({ mn: "Хүлээгдэж байна", en: "Pending" }) :
                           booking.status === "confirmed" ? t({ mn: "Батлагдсан", en: "Confirmed" }) :
                           booking.status === "completed" ? t({ mn: "Дууссан", en: "Completed" }) :
                                                            booking.status}
                        </span>
                      </div>

                      {booking.note && (
                        <p className="text-[13px] text-earth/70 bg-stone/20 rounded-2xl px-4 py-2 mb-3 italic">
                          "{booking.note}"
                        </p>
                      )}

                      {booking.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleStatusChange(booking._id, "confirmed")}
                            disabled={actionLoading === booking._id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-[14px] active:scale-95 transition-all"
                          >
                            {actionLoading === booking._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {t({ mn: "Батлах", en: "Confirm" })}
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking._id, "rejected")}
                            disabled={actionLoading === booking._id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-100 text-red-700 border border-red-200 rounded-2xl font-semibold text-[14px] active:scale-95 transition-all"
                          >
                            <XCircle size={16} />
                            {t({ mn: "Татгалзах", en: "Decline" })}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* WEEK VIEW */}
          {activeTab === "week" && (
            <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Week Nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setWeekStart(d => addDays(d, -7))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone/30 flex items-center justify-center active:scale-95 transition-all">
                  <ChevronLeft size={20} className="text-ink" />
                </button>
                <span className="text-[14px] font-semibold text-ink">
                  {weekStart.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric" })}
                  {" — "}
                  {addDays(weekStart, 6).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric" })}
                </span>
                <button onClick={() => setWeekStart(d => addDays(d, 7))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone/30 flex items-center justify-center active:scale-95 transition-all">
                  <ChevronRight size={20} className="text-ink" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="text-[11px] font-bold text-earth/50 text-right pr-2 pt-1">
                  {t({ mn: "Цаг", en: "Time" })}
                </div>
                {weekDays.map(d => {
                  const ds = toDateStr(d);
                  const isToday = ds === today;
                  return (
                    <div key={ds} className={`text-center rounded-xl py-1 ${isToday ? "bg-gold/10" : ""}`}>
                      <p className="text-[10px] font-bold text-earth/50 uppercase">
                        {d.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", { weekday: "short" })}
                      </p>
                      <p className={`text-[14px] font-semibold ${isToday ? "text-gold" : "text-ink"}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="overflow-x-auto">
                {HOURS.map(hour => (
                  <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-[11px] font-bold text-earth/40 text-right pr-2 pt-2">{hour}</div>
                    {weekDays.map(d => {
                      const ds = toDateStr(d);
                      const booking = getBookingForSlot(ds, hour);
                      const isBlocked = booking?.status === "blocked";
                      const key = `${ds}_${hour}`;
                      const isLoading = actionLoading === key;

                      return (
                        <button
                          key={ds}
                          onClick={() => !booking || isBlocked ? handleBlockSlot(ds, hour) : undefined}
                          className={`h-10 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                            !booking
                              ? "bg-stone/20 hover:bg-stone/40"
                              : booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : booking.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : booking.status === "blocked"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isLoading ? <Loader2 size={12} className="animate-spin mx-auto" /> :
                           isBlocked ? <Lock size={12} className="mx-auto" /> :
                           booking ? "●" : ""}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { color: "bg-amber-100 border-amber-300", label: t({ mn: "Хүлээгдэж байна", en: "Pending" }) },
                  { color: "bg-emerald-100 border-emerald-300", label: t({ mn: "Батлагдсан", en: "Confirmed" }) },
                  { color: "bg-blue-100 border-blue-300", label: t({ mn: "Дууссан", en: "Completed" }) },
                  { color: "bg-red-100 border-red-300", label: t({ mn: "Хаасан", en: "Blocked" }) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm border ${item.color}`} />
                    <span className="text-[11px] font-bold text-earth/60">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-white rounded-2xl border border-stone/20">
                <div className="flex items-center gap-2 text-[13px] text-earth/70">
                  <Lock size={14} className="text-red-400" />
                  <span>{t({ mn: "Хоосон нүд дарж цаг хааж/нээх боломжтой", en: "Tap an empty slot to block/unblock it" })}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* EARNINGS VIEW */}
          {activeTab === "earnings" && (
            <motion.div key="earnings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-gradient-to-br from-gold to-amber-600 rounded-3xl p-6 text-white mb-6 shadow-gold">
                <p className="text-[13px] font-bold opacity-80 mb-1 uppercase tracking-widest">
                  {t({ mn: "Энэ сарын орлого", en: "This Month's Earnings" })}
                </p>
                <p className="text-[38px] font-semibold leading-none">
                  {monthEarnings.toLocaleString()}₮
                </p>
                <p className="text-[13px] opacity-70 mt-2">
                  {bookings.filter(b => b.status === "completed" && b.date.startsWith(thisMonth)).length} {t({ mn: "засал дууссан", en: "sessions completed" })}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {
                    label: t({ mn: "Нийт захиалга", en: "Total Bookings" }),
                    value: bookings.length,
                    icon: Calendar,
                    color: "text-gold"
                  },
                  {
                    label: t({ mn: "Хүлээгдэж байна", en: "Pending" }),
                    value: bookings.filter(b => b.status === "pending").length,
                    icon: Clock,
                    color: "text-amber-500"
                  },
                  {
                    label: t({ mn: "Батлагдсан", en: "Confirmed" }),
                    value: bookings.filter(b => b.status === "confirmed").length,
                    icon: CheckCircle,
                    color: "text-emerald-500"
                  },
                  {
                    label: t({ mn: "Цуцлагдсан", en: "Cancelled" }),
                    value: bookings.filter(b => b.status === "cancelled").length,
                    icon: XCircle,
                    color: "text-red-400"
                  },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-3xl p-5 shadow-sm border border-stone/20">
                    <stat.icon size={22} className={`${stat.color} mb-3`} />
                    <p className="text-[28px] font-semibold text-ink">{stat.value}</p>
                    <p className="text-[12px] font-bold text-earth/60">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent completions */}
              <h2 className="text-[16px] font-semibold text-ink mb-3">
                {t({ mn: "Дууссан захиалгууд", en: "Completed Sessions" })}
              </h2>
              <div className="space-y-2">
                {bookings
                  .filter(b => b.status === "completed")
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 10)
                  .map(b => (
                    <div key={b._id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-stone/20">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{b.clientName}</p>
                        <p className="text-[12px] text-earth/60">{b.date} · {b.time}</p>
                      </div>
                      <span className="text-[14px] font-semibold text-emerald-600">+40,000₮</span>
                    </div>
                  ))}
                {bookings.filter(b => b.status === "completed").length === 0 && (
                  <div className="text-center py-10 text-earth/40">
                    <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="font-bold">{t({ mn: "Дууссан захиалга алга", en: "No completed sessions yet" })}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
