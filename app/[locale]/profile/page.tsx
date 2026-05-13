"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Video, Loader2, Edit, Upload, LogOut, LogIn,
  TrendingUp, CheckCircle, History, MessageCircle,
  X, Save, Phone, UserCircle, Plus, Sun, ChevronRight, Settings
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import LiveRitualRoom from "../../components/LiveRitualRoom";
import ChatWindow from "../../components/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// --- TYPES ---
interface UserProfile {
  _id: string; role: "client" | "monk"; monkStatus?: string;
  name?: { mn: string; en: string }; title?: { mn: string; en: string };
  services?: any[]; schedule?: any[]; blockedSlots?: any[];
  earnings?: number; image?: string; avatar?: string;
  bio?: { mn: string; en: string }; specialties?: string[];
  yearsOfExperience?: number; phone?: string;
  firstName?: string; lastName?: string; isSpecial?: boolean;
}
interface Booking {
  _id: string; monkId: string; clientId?: string; clientName: string;
  serviceName: any; date: string; time: string; status: string; callStatus?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { language: lang, t } = useLanguage();
  const router = useRouter();
  const lk = lang === "mn" ? "mn" : "en";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allMonks, setAllMonks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeRoomToken, setActiveRoomToken] = useState<string | null>(null);
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const isMonk = profile?.role === "monk";

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const userId = user.id;

      const profileUrl =
        user.role === "monk"
          ? `/api/monks/${userId}`
          : `/api/users/${userId}`;

      const [profileRes, monksRes] = await Promise.all([
        fetch(profileUrl, { cache: "no-store" }),
        fetch("/api/monks"),
      ]);

      let profileData = profileRes.ok ? await profileRes.json() : null;
      if (!profileData && user.authType === "custom") profileData = user;

      if (profileData) {
        setProfile(profileData);
        const isM = profileData.role === "monk";

        const bRes = await fetch(
          `/api/bookings?${isM ? "monkId" : "userId"}=${profileData._id}`,
        );
        if (bRes.ok) setBookings(await bRes.json());

        if (!isM && monksRes?.ok) {
          setAllMonks(await monksRes.json());
        }
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchData();

      // Background sync on visibility change (more efficient than interval)
      const onVis = () => {
        if (document.visibilityState === "visible") fetchData();
      };
      document.addEventListener("visibilitychange", onVis);
      return () => document.removeEventListener("visibilitychange", onVis);
    }
  }, [authLoading, user, fetchData]);

  const { upcomingBookings, historyBookings, acceptedCount, totalEarnings } = useMemo(() => {
    const upcoming: Booking[] = [], history: Booking[] = [];
    let acc = 0;
    bookings.forEach(b => {
      const fin = ["completed", "cancelled", "rejected"].includes(b.status);
      const up = !fin && ["confirmed", "pending"].includes(b.status);
      if (["confirmed", "completed"].includes(b.status)) acc++;
      if (up) upcoming.push(b); else history.push(b);
    });
    upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    return { upcomingBookings: upcoming, historyBookings: history, acceptedCount: acc, totalEarnings: acc * (profile?.isSpecial ? 88800 : 40000) };
  }, [bookings, profile]);


  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await logout(); } catch { window.location.href = `/${lang}/sign-in`; }
  };

  const handleDeleteAccount = async () => {
    if (!profile?._id) return;
    const ok = window.confirm(
      lang === "mn"
        ? "Та өөрийн бүртгэл болон холбогдох мэдээллүүдээ бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй."
        : "Delete your account and related data permanently? This cannot be undone.",
    );
    if (!ok) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(profile._id)}/delete-account`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || "Delete failed");
      }
      // After deletion, sign out and return to home.
      await logout();
      router.push(`/${lang}`);
    } catch (e) {
      console.error("Delete account failed:", e);
      alert(
        lang === "mn"
          ? "Устгал амжилтгүй боллоо. Дахин оролдоно уу."
          : "Account deletion failed. Please try again.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    try {
      const r = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const d = await r.json();
      setEditForm((p: any) => ({ ...p, avatar: d.secure_url, image: d.secure_url }));
    } catch (e) { console.error(e); }
    finally { setUploadingImage(false); }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const ep = isMonk ? `/api/monks/${profile._id}` : `/api/users/${user?.id}`;
      const r = await fetch(ep, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (r.ok) { setProfile({ ...profile, ...editForm }); setIsEditOpen(false); }
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };


  // --- RENDER: Guest ---
  if (!authLoading && !user) {
    return (
      <main className="relative flex min-h-[100svh] flex-col items-center justify-center bg-cream px-6 page-safe-top page-safe-bottom">
        <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-black/[0.06] bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F2F2F7]">
            <UserCircle size={38} className="text-gold" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {t({ mn: "Аяллын эхлэл", en: "Start your journey" })}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-earth/70">
            {t({ mn: "Профайл нээснээр засал захиалах, багш нартай шууд холбогдох боломжтой болно.", en: "Sign in to book rituals and connect with mentors." })}
          </p>
          <Link href={`/${lang}/sign-in`} className="mt-8 block">
            <span className="cta-button flex min-h-[50px] w-full items-center justify-center gap-2">
              <LogIn size={18} />
              {t({ mn: "Нэвтрэх / Бүртгүүлэх", en: "Sign in / Register" })}
            </span>
          </Link>

          <div className="mt-6 text-[13px] text-earth">
            <Link
              href={`/${lang}/privacy`}
              className="underline underline-offset-4 hover:text-ink active:opacity-70"
            >
              {t({ mn: "Нууцлалын бодлого", en: "Privacy Policy" })}
            </Link>
            <span className="mx-2 text-earth/40">·</span>
            <Link
              href={`/${lang}/terms`}
              className="underline underline-offset-4 hover:text-ink active:opacity-70"
            >
              {t({ mn: "Үйлчилгээний нөхцөл", en: "Terms of Service" })}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- RENDER: Loading ---
  if (authLoading || loading) {
    return (
      <div className="min-h-[100svh] bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-gold" />
      </div>
    );
  }

  // --- RENDER: Monk Pending ---
  if (isMonk && profile?.monkStatus === "pending") {
    return (
      <div className="min-h-[100svh] bg-cream flex items-center justify-center px-6 page-safe-top">
        <div className="w-full max-w-sm rounded-[20px] border border-black/[0.06] bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto mb-4 animate-spin text-gold" size={36} />
          <h2 className="text-[20px] font-semibold text-ink mb-2">Хүсэлт хүлээгдэж байна</h2>
          <p className="text-[14px] text-earth/80">Таны хүсэлт хянагдаж байна. Баталгаажсаны дараа имэйл ирнэ.</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name?.[lk] || user?.fullName || user?.firstName || user?.phone || "Хэрэглэгч";
  const displayTitle = isMonk ? (profile?.title?.[lk] || "Багш") : (lang === "mn" ? "Эрхэм сүсэгтэн" : "Seeker");

  return (
    <div className="relative min-h-[100svh] bg-cream pb-[calc(var(--tab-bar-height,0px)+8px)] page-safe-top page-safe-bottom selection:bg-gold/20">
      {/* ── HERO PROFILE HEADER (Glassmorphism & Centered) ── */}
      <section className="relative z-10 mb-6 pt-8 pb-6">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="relative mb-4">
            {/* Avatar */}
            {user?.authType === "clerk" ? (
              <div className="scale-[1.8] origin-center"><UserButton /></div>
            ) : (
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-sm bg-[#F2F2F7]">
                {(profile?.avatar || profile?.image || user?.avatar) ? (
                  <img src={profile?.avatar || profile?.image || user?.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-gold">
                    {displayName?.[0]}
                  </div>
                )}
              </div>
            )}
            
            {/* Edit Button (Small icon overlay) */}
            <button
              onClick={() => { setEditForm(profile || {}); setIsEditOpen(true); }}
              className="absolute bottom-0 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.06] bg-white shadow-sm text-ink"
            >
              <Edit size={12} />
            </button>
          </div>
          
          <h2 className="font-serif text-[22px] font-semibold text-ink tracking-tight">
            {displayName}
          </h2>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-earth/50">
            {displayTitle}
          </p>
        </div>
      </section>

      <div className="px-4">

          {/* Stats (monk only) */}
          {isMonk && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/[0.06] bg-[#F8FAFC] p-3 text-center" data-pressable="false">
                <p className="text-[20px] font-semibold text-ink">
                  {totalEarnings.toLocaleString()}₮
                </p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-earth/45">
                  {lang === "mn" ? "Нийт орлого" : "Total Earnings"}
                </p>
              </div>
              <div className="rounded-2xl border border-black/[0.06] bg-[#F8FAFC] p-3 text-center" data-pressable="false">
                <p className="text-[20px] font-semibold text-ink">{acceptedCount}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-earth/45">
                  {lang === "mn" ? "Захиалга" : "Bookings"}
                </p>
              </div>
            </div>
          )}

      </div>

      {/* ── BOOKINGS ── */}
      <section className="relative z-10 mb-6 px-4">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-earth/40">
            {t({ mn: "Захиалга", en: "Bookings" })}
          </p>
          <h3 className="font-serif text-[22px] font-semibold text-ink tracking-tight">
            {lang === "mn" ? "Таны хуваарь" : "Your schedule"}
          </h3>
        </div>
        <div className="native-scroll-x flex gap-2 mb-5 -mx-4 px-4 pb-1" data-pressable="false">
          {(["upcoming", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pill-tab ${tab === t ? "active" : "inactive"}`}>
              {t === "upcoming" ? (lang === "mn" ? "Ирэх" : "Upcoming") : (lang === "mn" ? "Түүх" : "History")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(tab === "upcoming" ? upcomingBookings : historyBookings).length === 0 ? (
            <div className="rounded-[20px] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-sm">
              <History size={28} className="mx-auto mb-3 text-earth/35" />
              <p className="font-serif text-[15px] font-medium text-ink/75">{lang === "mn" ? "Захиалга байхгүй" : "No bookings yet"}</p>
              <p className="mt-1 text-[13px] text-earth/55">{lang === "mn" ? "Засал захиалж эхлүүлээрэй" : "Book a ritual to see it here"}</p>
            </div>
          ) : (tab === "upcoming" ? upcomingBookings : historyBookings).map(b => (
            <div
              key={b._id}
              className="card-white rounded-[20px] border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-earth/50">
                    {b.serviceName?.[lk] || b.serviceName?.mn || "Үйлчилгээ"}
                  </p>
                  <p className="truncate font-serif text-[15px] font-semibold text-ink">
                    {isMonk ? b.clientName : (allMonks.find(m => m._id === b.monkId)?.name?.[lk] || "Багш")}
                  </p>
                  <p className="text-[11px] text-earth mt-1">{b.date} · {b.time}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "pending" ? "bg-orange-100 text-orange-700" :
                    b.status === "completed" ? "bg-gray-100 text-gray-700" : "bg-red-100 text-red-700"
                  }`}>
                    {b.status.toUpperCase()}
                  </span>
                  {b.status === "confirmed" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => router.push(`/${lang}/booking/${b._id}`)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-white shadow-sm"
                      >
                        <MessageCircle size={15} className="text-earth" />
                      </button>
                      <button
                        onClick={() => router.push(`/${lang}/booking/${b._id}`)}
                        disabled={joiningId === b._id}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-gold shadow-sm disabled:opacity-50"
                      >
                        {joiningId === b._id ? <Loader2 size={14} className="text-white animate-spin" /> : <Video size={14} className="text-white" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SETTINGS / ACTIONS LIST ── */}
      <section className="relative z-10 mt-2 mb-8 px-4">
        <h3 className="mb-3 ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-earth/40">
          {lang === "mn" ? "Тохиргоо" : "Settings"}
        </h3>
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04]">
          <button
            onClick={() => { setEditForm(profile || {}); setIsEditOpen(true); }}
            className="flex w-full items-center justify-between border-b border-black/[0.04] p-4 bg-white active:bg-black/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04]">
                <Settings size={16} className="text-earth" />
              </div>
              <span className="text-[15px] font-medium text-ink">{lang === "mn" ? "Профайл засах" : "Edit Profile"}</span>
            </div>
            <ChevronRight size={18} className="text-earth/40" />
          </button>
          
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-between border-b border-black/[0.04] p-4 bg-white active:bg-black/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04]">
                {isSigningOut ? <Loader2 size={16} className="animate-spin text-earth" /> : <LogOut size={16} className="text-earth" />}
              </div>
              <span className="text-[15px] font-medium text-ink">{lang === "mn" ? "Гарах" : "Sign Out"}</span>
            </div>
            <ChevronRight size={18} className="text-earth/40" />
          </button>
          
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="flex w-full items-center justify-between p-4 bg-white active:bg-red-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                {isDeletingAccount ? <Loader2 size={16} className="animate-spin text-red-500" /> : <X size={16} className="text-red-500" />}
              </div>
              <span className="text-[15px] font-medium text-red-600">{lang === "mn" ? "Бүртгэл устгах" : "Delete Account"}</span>
            </div>
            <ChevronRight size={18} className="text-red-500/40" />
          </button>
        </div>
      </section>

      <AnimatePresence>
        {isEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 backdrop-blur-md"
            onClick={() => setIsEditOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="w-full max-w-lg rounded-t-[28px] border-t border-black/[0.06] bg-cream p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10" />
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[18px] font-black text-ink">
                  {lang === "mn" ? "Профайл засах" : "Edit Profile"}
                </h3>
                <button onClick={() => setIsEditOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-white shadow-sm">
                  <X size={16} className="text-earth" />
                </button>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone">
                    <img src={editForm.avatar || profile?.avatar || profile?.image || ""} className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gold">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Upload size={11} className="text-white" />
                  </label>
                </div>
                {uploadingImage && <span className="text-[12px] text-earth">Хуулж байна...</span>}
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="input-label">{lang === "mn" ? "Утасны дугаар" : "Phone Number"}</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth" />
                  <input
                    className="input pl-10"
                    value={editForm.phone || ""}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+976 9900 0000"
                  />
                </div>
              </div>

              <button onClick={saveProfile} disabled={isSaving} className="cta-button mt-2 flex min-h-[52px] w-full items-center justify-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {lang === "mn" ? "Хадгалах" : "Save Profile"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAT MODAL ── */}
      <AnimatePresence>
        {activeChatBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 backdrop-blur-md"
            onClick={() => setActiveChatBooking(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="flex w-full max-w-lg flex-col rounded-t-[28px] border-t border-black/[0.06] bg-cream shadow-[0_-12px_40px_rgba(0,0,0,0.08)]"
              style={{
                height: "80svh",
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] p-5">
                <h3 className="text-[16px] font-black text-ink">
                  {lang === "mn" ? "Чат" : "Chat"}
                </h3>
                <button onClick={() => setActiveChatBooking(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-white shadow-sm">
                  <X size={16} className="text-earth" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWindow
                  bookingId={activeChatBooking._id}
                  currentUserId={user?.id || ""}
                  currentUserName={profile?.name?.[lk] || user?.fullName || "User"}
                  isMonk={isMonk}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
