"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle, ArrowRight, FileText, Calendar
} from "lucide-react";

// ─── Dynamic Imports for Performance ──────────────────────────────────────────
const DashboardStats = dynamic(() => import("./DashboardStats"), { 
  loading: () => <Skeleton className="h-24 mb-6" /> 
});
const DashboardBookings = dynamic(() => import("./DashboardBookings"), { 
  loading: () => <Skeleton className="h-64 mb-6" /> 
});
const DashboardMonks = dynamic(() => import("./DashboardMonks"), { 
  loading: () => <Skeleton className="h-96 mb-6" /> 
});

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Conversation {
  otherId: string;
  otherName: string;
  otherAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(d: Date) { return d.toISOString().split("T")[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-stone/30 rounded-2xl ${className}`} />;
}

export default function MonkDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language: lang } = useLanguage();
  const router = useRouter();
  const locale = lang as "mn" | "en";

  // ── State ──
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availableToggling, setAvailableToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Schedule management state
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d;
  });

  const today = toDateStr(new Date());
  const monkId = user?._id || user?.id;

  // ── Route Protection ──
  useEffect(() => {
    if (!authLoading && user && user.role !== "monk" && user.role !== "admin") {
      router.push(`/${lang}`);
    }
  }, [authLoading, user, lang, router]);

  // ── Fetch All Data ──
  const fetchAll = useCallback(async () => {
    if (!monkId) return;
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch(`/api/bookings?monkId=${monkId}`),
        fetch(`/api/conversations?userId=${monkId}`).catch(() => null),
      ]);

      if (bRes.ok) {
        const data = await bRes.json();
        setBookings(Array.isArray(data) ? data : []);
      }

      if (cRes?.ok) {
        const convs = await cRes.json();
        if (Array.isArray(convs)) {
          setConversations(convs.slice(0, 3));
          setUnreadTotal(convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
        }
      }
    } catch (e) {
      console.error("Dashboard fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [monkId]);

  useEffect(() => { if (monkId) fetchAll(); }, [monkId, fetchAll]);

  // ── Actions ──
  const toggleAvailable = async () => {
    if (!monkId) return;
    setAvailableToggling(true);
    try {
      const res = await fetch(`/api/monks/${monkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      if (res.ok) setIsAvailable(prev => !prev);
    } catch (e) { console.error(e); }
    finally { setAvailableToggling(false); }
  };

  const handleBookingAction = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const isComplete = status === "completed";
      const url = isComplete ? `/api/bookings/${id}/complete` : `/api/bookings/${id}`;
      const res = await fetch(url, {
        method: isComplete ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: status as any } : b));
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleBlockSlot = async (date: string, time: string) => {
    const key = `${date}_${time}`;
    setActionLoading(key);
    try {
      const existing = bookings.find(b => b.date === date && b.time === time && b.status === "blocked");
      if (existing) {
        await fetch(`/api/bookings/${existing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        setBookings(prev => prev.filter(b => b._id !== existing._id));
      } else {
        const res = await fetch("/api/bookings/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, time }),
        });
        if (res.ok) {
          const newBlock = await res.json();
          setBookings(prev => [...prev, { ...newBlock, status: "blocked" as const }]);
        }
      }
    } finally { setActionLoading(null); }
  };

  // ── Derived Data ──
  const todayBookings = useMemo(() =>
    bookings.filter(b => b.date === today && b.status !== "cancelled" && b.status !== "blocked")
      .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, today]
  );

  const upcomingBookings = useMemo(() => {
    const tomorrow = toDateStr(addDays(new Date(), 1));
    const weekEnd = toDateStr(addDays(new Date(), 7));
    return bookings.filter(b => b.date >= tomorrow && b.date <= weekEnd && b.status !== "cancelled" && b.status !== "blocked")
      .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  }, [bookings]);

  const monthEarnings = bookings.filter(b => b.status === "completed" && b.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, b) => s + (b.price || 40000), 0);
  
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(addDays(weekStart, 6));
  const weekEarnings = bookings.filter(b => b.status === "completed" && b.date >= weekStartStr && b.date <= weekEndStr)
    .reduce((s, b) => s + (b.price || 40000), 0);
  
  const pendingPayments = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + (b.price || 40000), 0);

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)]">
        <Skeleton className="w-16 h-16 !rounded-[1.5rem] mb-4" />
        <Skeleton className="h-6 w-36 mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const monkName = (user as any).name?.[locale] || (user as any).name?.mn || user.firstName || "Багш";
  const monkTitle = (user as any).title?.[locale] || (user as any).title?.mn || "";
  const monkImage = (user as any).image || (user as any).avatar || "/default-monk.jpg";

  return (
    <div className="min-h-screen bg-cream pb-32">
      <DashboardMonks 
        monkId={monkId}
        monkName={monkName}
        monkTitle={monkTitle}
        monkImage={monkImage}
        isAvailable={isAvailable}
        availableToggling={availableToggling}
        toggleAvailable={toggleAvailable}
        weekStart={weekStart}
        setWeekStart={setWeekStart}
        bookings={bookings}
        actionLoading={actionLoading}
        handleBlockSlot={handleBlockSlot}
        locale={locale}
      />

      <div className="px-5">
        <DashboardStats 
          monthEarnings={monthEarnings}
          weekEarnings={weekEarnings}
          pendingPayments={pendingPayments}
        />

        <DashboardBookings 
          todayBookings={todayBookings}
          upcomingBookings={upcomingBookings}
          actionLoading={actionLoading}
          handleBookingAction={handleBookingAction}
          locale={locale}
        />

        {/* MESSAGES */}
        <section className="mb-6">
          <Link href={`/${lang}/messenger`} className="block">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone/15 active:scale-[0.98] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageCircle size={18} className="text-blue-600" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-ink">{t({ mn: "Мессежүүд", en: "Messages" })}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadTotal > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                      {unreadTotal}
                    </span>
                  )}
                  <ArrowRight size={16} className="text-earth/40" />
                </div>
              </div>

              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map(c => (
                    <div key={c.otherId} className="flex items-center gap-3 py-2 border-t border-stone/10 first:border-0 first:pt-0">
                      <div className="w-9 h-9 rounded-full bg-stone/30 overflow-hidden shrink-0">
                        {c.otherAvatar && <Image src={c.otherAvatar} alt="" width={36} height={36} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{c.otherName}</p>
                        <p className="text-[11px] text-earth/50 truncate">{c.lastMessage || "..."}</p>
                      </div>
                      {(c.unreadCount || 0) > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">{c.unreadCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-earth/40 text-center py-2">{t({ mn: "Мессеж алга", en: "No messages" })}</p>
              )}
            </div>
          </Link>
        </section>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-2 gap-3">
          <Link href={`/${lang}/monk/schedule`}
            className="bg-white rounded-3xl p-5 shadow-sm border border-stone/15 active:scale-[0.97] transition-all">
            <Calendar size={22} className="text-gold mb-2" />
            <p className="text-[13px] font-semibold text-ink">{t({ mn: "Дэлгэрэнгүй хуваарь", en: "Full Schedule" })}</p>
          </Link>
          <Link href={`/${lang}/monk/content`}
            className="bg-white rounded-3xl p-5 shadow-sm border border-stone/15 active:scale-[0.97] transition-all">
            <FileText size={22} className="text-gold mb-2" />
            <p className="text-[13px] font-semibold text-ink">{t({ mn: "Контент бичих", en: "Write Content" })}</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
