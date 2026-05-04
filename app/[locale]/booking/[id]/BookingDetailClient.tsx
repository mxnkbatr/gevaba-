"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Calendar, Clock, User, 
  ShieldCheck, Loader2, MessageCircle 
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import CallLauncher from "./CallLauncher";
import ChatWindow from "@/app/components/ChatWindow";

export default function BookingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    if (!bookingId || bookingId === "initial") return;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        }
      } catch (e) {
        console.error("Fetch booking error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[100svh] bg-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">{t({ mn: "Захиалга олдсонгүй", en: "Booking not found" })}</h2>
        <button onClick={() => router.back()} className="text-gold font-bold">{t({ mn: "Буцах", en: "Go Back" })}</button>
      </div>
    );
  }

  const isMonk = user?.role === "monk";
  const partnerName = isMonk ? booking.clientName : booking.monkName;
  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    rejected: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-[100svh] bg-cream pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6 flex items-center gap-4 bg-cream/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone/10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="text-lg font-bold text-ink">{t({ mn: "Захиалгын дэлгэрэнгүй", en: "Booking Details" })}</h1>
      </header>

      <main className="px-5 pt-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone/10 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[booking.status as keyof typeof statusColors] || "bg-gray-100"}`}>
                {booking.status}
              </span>
              <h2 className="text-2xl font-bold text-ink mt-3">
                {booking.serviceName?.[lang as "mn" | "en"] || booking.serviceName?.mn || "Засал"}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-earth/40 uppercase tracking-widest">{t({ mn: "Үнэ", en: "Price" })}</p>
              <p className="text-xl font-bold text-gold">₮{Number(booking.price || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-gold">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-earth/40 uppercase">{t({ mn: "Огноо", en: "Date" })}</p>
                <p className="text-sm font-semibold text-ink">{booking.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-gold">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-earth/40 uppercase">{t({ mn: "Цаг", en: "Time" })}</p>
                <p className="text-sm font-semibold text-ink">{booking.time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone/10">
          <h3 className="text-[11px] font-bold text-earth/40 uppercase tracking-widest mb-4">
            {isMonk ? t({ mn: "Үйлчлүүлэгч", en: "Client" }) : t({ mn: "Лам багш", en: "Monk" })}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone/10 overflow-hidden relative">
              <User size={32} className="absolute inset-0 m-auto text-stone/30" />
              {/* If we had images we'd put them here */}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">{partnerName || "..."}</p>
              <p className="text-xs text-earth/60">{isMonk ? booking.userPhone : t({ mn: "Баталгаажсан", en: "Verified Mentor" })}</p>
            </div>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center text-gold active:scale-90 transition"
            >
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        {/* Call Launcher */}
        <CallLauncher
          bookingId={booking._id}
          monkName={partnerName}
          callStatus={booking.callStatus || "idle"}
          isMonk={isMonk}
        />

        {/* Completion Info */}
        {booking.status === "completed" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex items-start gap-4">
            <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-emerald-800">{t({ mn: "Засал амжилттай дууссан", en: "Ritual Session Completed" })}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {t({ mn: `Нийт үргэлжилсэн хугацаа: ${Math.floor((booking.callDurationSeconds || 0) / 60)} минут`, en: `Total duration: ${Math.floor((booking.callDurationSeconds || 0) / 60)} minutes` })}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] h-[80vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-ink">{t({ mn: "Мессеж", en: "Messages" })}</h3>
              <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center text-stone/60">
                <ChevronLeft className="rotate-[-90deg]" size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                bookingId={booking._id}
                currentUserId={user?.dbId || ""}
                currentUserName={user?.fullName || "User"}
                isMonk={isMonk}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
