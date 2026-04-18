"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Sparkles, Clock, Calendar as CalIcon, X, AlertCircle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import QPay from "@/app/components/checkout/QPay";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  _id: string;
  id?: string;
  name?: { mn: string; en: string };
  title?: { mn: string; en: string };
  description?: { mn: string; en: string };
  price: number;
  duration?: string;
  image?: string;
}

interface Monk {
  _id: string;
  name: { mn: string; en: string };
  image: string;
  title?: { mn: string; en: string };
  services?: Service[];
  schedule?: Array<{ day: string; active?: boolean; start?: string; end?: string; slots?: string[] }>;
  isSpecial?: boolean;
}

// ─── Confetti Component ───────────────────────────────────────────────────────
function Confetti() {
  useEffect(() => {
    import('canvas-confetti').then((module) => {
      const confetti = module.default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D97706", "#059669", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"],
        disableForReducedMotion: true
      });
    });
  }, []);
  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

function SkeletonLoader() {
  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)]">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-11 h-11" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="flex gap-3 overflow-hidden mb-8">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-40 shrink-0" />)}
      </div>
      <Skeleton className="h-80 w-full mb-6" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { user } = useAuth();

  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const monkId = searchParams.get("monkId");

  // ── State ──
  const [monk, setMonk] = useState<Monk | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [createdBooking, setCreatedBooking] = useState<{ id: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"select" | "confirm" | "success" | "error">("select");
  const [errorMsg, setErrorMsg] = useState("");
  
  // ── Fetch Monk + Services in parallel ──
   useEffect(() => {
    if (!monkId) return;
    if (bookingId === 'initial') return;
    (async () => {
      setLoading(true);
      try {
        const { fetchWithSessionCache } = await import('@/lib/fetchWithFallback');
        const [mRes, sRes] = await Promise.all([
          fetch(`/api/monks/${monkId}`),
          fetchWithSessionCache(`/api/services?monkId=${monkId}`, 10).catch(() => ({ ok: false } as any)),
        ]);
        const mData: Monk = await mRes.json();
        setMonk(mData);

        let services: Service[] = [];
        if (sRes.ok) {
          const sData = await sRes.json();
          if (Array.isArray(sData) && sData.length > 0) services = sData;
        }
        if (services.length === 0 && mData.services?.length) {
          services = mData.services.map((s: any) => ({
            ...s,
            _id: s._id || s.id || `${s.name?.mn}`,
            price: mData.isSpecial ? 88800 : (s.price || 45000),
          }));
        }
        if (services.length === 0 && bookingId && bookingId.length > 10) {
          const r = await fetch(`/api/services/${bookingId}`).catch(() => null);
          if (r?.ok) {
            const sd = await r.json();
            services = [{ ...sd, price: mData.isSpecial ? 88800 : (sd.price || 45000) }];
          }
        }
        setAllServices(services);
        if (services.length > 0) setSelectedService(services[0]);
      } catch (e) {
        console.error("Failed to load booking data", e);
      } finally {
        setLoading(false);
      }
      })();
    },[monkId, bookingId]);


  // ── Fetch booked slots when date changes ──
  useEffect(() => {
    if (!monkId || !selectedDate) return;
    if (bookingId === 'initial') return;
    setFetchingSlots(true);
    setSelectedTime(null);
    const dateStr = selectedDate.toISOString().split("T")[0];
    fetch(`/api/bookings?monkId=${monkId}&date=${dateStr}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBookedSlots(Array.isArray(data) ? data : []))
      .catch(() => setBookedSlots([]))
      .finally(() => setFetchingSlots(false));
  }, [monkId, selectedDate, bookingId]);


  // ── Calendar grid ──
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= days; i++) grid.push(new Date(year, month, i));
    return grid;
  }, [currentMonth]);

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const isDayAvailable = useCallback((date: Date) => {
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    if (isPast) return false;
    if (!monk?.schedule) return true;
    const dayName = DAY_NAMES[date.getDay()];
    return monk.schedule.some(s => s.day === dayName && s.active !== false);
  }, [monk]);

  // ── Available time slots ──
  const availableTimes = useMemo(() => {
    const defaultSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    let slots: string[] = [];

    if (monk?.schedule) {
      const dayName = DAY_NAMES[selectedDate.getDay()];
      const daySchedule = monk.schedule.find(s => s.day === dayName && s.active !== false);
      if (daySchedule?.slots?.length) {
        slots = daySchedule.slots;
      } else if (daySchedule) {
        const startH = parseInt(daySchedule.start?.split(":")[0] || "9");
        const endH = parseInt(daySchedule.end?.split(":")[0] || "18");
        for (let h = startH; h < endH; h++) slots.push(`${h.toString().padStart(2, "0")}:00`);
      }
    } else {
      slots = defaultSlots;
    }

    return slots.filter(t => !bookedSlots.includes(t));
  }, [monk, selectedDate, bookedSlots]);

  // First available time highlight
  const firstAvailable = availableTimes[0];

  // ── Submit booking ──
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !user || !selectedService) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monkId,
          serviceId: selectedService._id || selectedService.id,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          userId: user._id || user.id,
          userName: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email,
          userEmail: user.email,
          userPhone: user.phone || "",
          serviceName: selectedService.name || selectedService.title,
          note: "",
          amount: selectedService.price,
          status: "pending_payment" // Add this for backend tracking
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Booking failed");
      }

      const data = await res.json();
      setCreatedBooking({ 
          id: data.bookingId || data.id || data._id, 
          amount: selectedService.price 
        });
    } catch (err: any) {
      setErrorMsg(err.message || t({ mn: "Алдаа гарлаа", en: "Booking failed" }));
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add to Calendar ──
  const addToCalendar = () => {
    if (!selectedDate || !selectedTime || !monk || !selectedService) return;
    const dateStr = selectedDate.toISOString().split("T")[0].replace(/-/g, "");
    const [h, m] = selectedTime.split(":").map(Number);
    const duration = parseInt(selectedService.duration || "60");
    const endH = h + Math.floor(duration / 60);
    const endM = m + (duration % 60);
    const start = `${dateStr}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
    const end = `${dateStr}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
    const monkName = monk.name?.[lang as "mn" | "en"] || monk.name?.mn;
    const svcName = selectedService.name?.[lang as "mn" | "en"] || selectedService.name?.mn || "Засал";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${svcName} — ${monkName}`)}&dates=${start}/${end}&details=${encodeURIComponent("Gevabal - Буддын духовн платформ")}`;
    window.open(url, "_blank");
  };

  if (bookingId === 'initial') {
    return <SkeletonLoader />;
  }

  // ═══════════════════════════════════════════════════════════
// QPAY PAYMENT SCREEN
    // ═══════════════════════════════════════════════════════════
    if (createdBooking) {
      return (
        <div className="min-h-[100svh] bg-cream flex flex-col items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h2 className="text-[24px] font-semibold text-ink mb-2">
                {t({ mn: "Төлбөр төлөх", en: "Complete Payment" })}
              </h2>
              <p className="text-[15px] text-earth/60">
                ₮{createdBooking.amount.toLocaleString()}
              </p>
            </div>
            
            <QPay
              orderId={createdBooking.id}
              amount={createdBooking.amount}
              onSuccess={() => {
                setCreatedBooking(null);
                setStep("success"); // Show your existing success screen after payment
              }}
            />
            
            <button
              onClick={() => setCreatedBooking(null)}
              className="mt-6 w-full py-4 rounded-[1.5rem] bg-white/90 border border-gold/20 font-semibold text-[15px] text-ink shadow-sm backdrop-blur-sm"
            >
              {t({ mn: "← Буцах", en: "← Go Back" })}
            </button>
          </motion.div>
        </div>
      );
    }

  // ═══════════════════════════════════════════════════════════
  // SUCCESS screen
  // ═══════════════════════════════════════════════════════════
  if (step === "success") {
    const monkName = monk?.name?.[lang as "mn" | "en"] || monk?.name?.mn || "Багш";
    const svcName = selectedService?.name?.[lang as "mn" | "en"] || selectedService?.name?.mn || "Засал";
    return (
      <div className="min-h-[100svh] bg-cream flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <Confetti />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-28 h-28 rounded-[2.5rem] bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-8 shadow-xl"
        >
          <CheckCircle2 size={56} className="text-emerald-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-[28px] font-semibold text-ink mb-3 tracking-tight">
            {t({ mn: "Захиалга амжилттай!", en: "Booking Confirmed!" })}
          </h2>
          <p className="text-[15px] text-earth/60 leading-relaxed max-w-[280px] mx-auto mb-8">
            {t({ mn: `${monkName} багштай ${svcName} засал захиалагдлаа.`, en: `Your session with ${monkName} has been booked.` })}
          </p>

          {/* Summary pill */}
          <div className="monastery-card bg-white/90 rounded-[1.75rem] p-5 shadow-gold border border-gold/14 mb-8 text-left max-w-[320px] mx-auto backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gold/12">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gold/18">
                <Image src={monk?.image || "/default-monk.jpg"} alt={monkName} width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ink">{monkName}</p>
                <p className="text-[12px] font-bold text-gold">{svcName}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-earth/40 uppercase">{t({ mn: "Огноо", en: "Date" })}</p>
                <p className="text-[14px] font-semibold text-ink">{selectedDate?.toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-earth/40 uppercase">{t({ mn: "Цаг", en: "Time" })}</p>
                <p className="text-[14px] font-semibold text-ink">{selectedTime}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-earth/40 uppercase">{t({ mn: "Үнэ", en: "Price" })}</p>
                <p className="text-[14px] font-semibold text-gold">₮{Number(selectedService?.price || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-[320px] mx-auto">
            <button
              onClick={addToCalendar}
              className="w-full py-4 rounded-[1.5rem] bg-white/90 border border-gold/22 font-semibold text-[15px] text-ink active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm backdrop-blur-sm"
            >
              <CalIcon size={18} className="text-gold" />
              {t({ mn: "📅 Calendar-т нэмэх", en: "📅 Add to Calendar" })}
            </button>
            <button
              onClick={() => router.push(`/${lang}/profile`)}
              className="cta-button w-full py-4 min-h-[52px] rounded-[1.15rem] text-[13px] active:scale-95 transition-all border-0"
            >
              {t({ mn: "Профайл руу буцах", en: "Go to Profile" })}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LOADING skeleton
  // ═══════════════════════════════════════════════════════════
  if (loading || !monk) {
    return <SkeletonLoader />;
  }

  const monkName = monk.name?.[lang as "mn" | "en"] || monk.name?.mn || "Багш";
  const selectedSvcName = selectedService?.name?.[lang as "mn" | "en"] || selectedService?.name?.mn || "Үйлчилгээ";
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-[100svh] bg-cream flex flex-col">

      {/* ── STICKY FOCUSED HEADER ── */}
      <header
        className="px-5 pb-6 flex items-center justify-between bg-cream/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-stone/10"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 44px) + 16px)" }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone/20 flex items-center justify-center shrink-0 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} className="text-ink" />
          </button>
          <div className="min-w-0">
             <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-0.5 opacity-80">{t({ mn: "Цаг захиалах", en: "New Booking" })}</p>
             <h1 className="text-[17px] font-semibold text-ink truncate leading-none">
                {monkName}
             </h1>
          </div>
        </div>

        <div className="relative shrink-0">
           <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden border-2 border-white shadow-sm rotate-3">
              <Image src={monk.image || "/default-monk.jpg"} alt={monkName} width={48} height={48} className="w-full h-full object-cover" />
           </div>
           <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">

        {/* ══ SECTION 1: SERVICE SELECTION ══ */}
        {allServices.length > 0 && (
          <div className="pt-8 pb-2">
            <div className="px-5 mb-4 flex items-center justify-between">
               <h2 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
                 {t({ mn: "Үйлчилгээ сонгох", en: "Choose Service" })}
               </h2>
               <div className="h-[1px] flex-1 bg-stone/20 ml-4 opacity-50" />
            </div>
            <div className="flex gap-3 overflow-x-auto pl-5 pr-5 pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
              {allServices.map(svc => {
                const isSelected = selectedService?._id === svc._id || selectedService?.id === svc.id;
                const svcName = svc.name?.[lang as "mn" | "en"] || svc.name?.mn || svc.title?.[lang as "mn" | "en"] || svc.title?.mn || "Үйлчилгээ";
                return (
                  <motion.button
                    key={svc._id || svc.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setSelectedService(svc); setSelectedTime(null); }}
                    className={`shrink-0 w-44 rounded-3xl border-2 overflow-hidden text-left transition-all ${
                      isSelected
                        ? "border-gold shadow-[0_0_0_4px_rgba(217,119,6,0.12)] bg-white"
                        : "border-stone/30 bg-white/70"
                    }`}
                    style={{ scrollSnapAlign: "start" }}
                  >
                    {svc.image && (
                      <div className="w-full h-24 overflow-hidden bg-stone/20">
                        <Image src={svc.image} alt={svcName} width={176} height={96} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-[12px] font-semibold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-earth/40'}`}>
                          {svc.duration || "30 min"}
                        </p>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
                            <CheckCircle2 size={12} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                      <h3 className="text-[14px] font-semibold text-ink leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{svcName}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[18px] font-semibold text-ink">₮{Number(svc.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SECTION 2: CALENDAR ══ */}
        <div className="px-5 pt-10 pb-2">
          <div className="mb-4 flex items-center justify-between">
             <h2 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
               {t({ mn: "Огноо сонгох", en: "Pick a Date" })}
             </h2>
             <div className="h-[1px] flex-1 bg-stone/20 ml-4 opacity-50" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-5 border border-stone/20 shadow-sm"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-xl bg-stone/20 flex items-center justify-center active:scale-90 transition-all"
              >
                <ChevronLeft size={18} className="text-earth" />
              </button>
              <h2 className="text-[16px] font-semibold text-ink">
                {currentMonth.toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US", { year: "numeric", month: "long" })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-xl bg-stone/20 flex items-center justify-center active:scale-90 transition-all"
              >
                <ChevronRight size={18} className="text-earth" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-3">
              {(lang === "mn"
                ? ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]
                : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
              ).map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-earth/30 uppercase tracking-wider pb-2">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-0.5">
              {calendarGrid.map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} />;
                const isSelected = date.toDateString() === selectedDate?.toDateString();
                const isToday = date.toDateString() === today.toDateString();
                const available = isDayAvailable(date);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <AnimatePresence mode="wait">
                      <motion.button
                        whileTap={available ? { scale: 0.9 } : {}}
                        onClick={() => available && setSelectedDate(date)}
                        disabled={!available}
                        className={`w-10 h-10 rounded-[0.9rem] flex items-center justify-center text-[14px] font-semibold transition-all ${
                          isSelected
                            ? "bg-gradient-to-br from-gold to-amber-600 text-white shadow-gold"
                            : isToday && !isSelected
                            ? "border-2 border-gold text-gold"
                            : !available
                            ? "text-earth/20 cursor-not-allowed bg-transparent"
                            : "text-ink hover:bg-stone/30"
                        }`}
                      >
                        {date.getDate()}
                      </motion.button>
                    </AnimatePresence>
                    {available && !isSelected && (
                      <div className="w-1 h-1 rounded-full bg-gold/60 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ══ SECTION 3: TIME SLOTS ══ */}
        <div className="px-5 pt-10 pb-2">
          <div className="mb-4 flex items-center justify-between">
             <h2 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
               {t({ mn: "Цаг сонгох", en: "Choose Time" })}
             </h2>
             <div className="h-[1px] flex-1 bg-stone/20 ml-4 opacity-50" />
          </div>

          {fetchingSlots ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="py-10 bg-stone/10 rounded-[2rem] border border-dashed border-stone/40 text-center">
              <Clock size={28} className="text-earth/30 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-earth/40">
                {t({ mn: "Боломжит цаг олдсонгүй", en: "No available slots" })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {/* All slots — both booked and available */}
              {(() => {
                const allSlots = monk?.schedule
                  ? (() => {
                      const dayName = DAY_NAMES[selectedDate.getDay()];
                      const daySchedule = monk.schedule?.find(s => s.day === dayName && s.active !== false);
                      if (!daySchedule) return availableTimes;
                      if (daySchedule.slots?.length) return daySchedule.slots;
                      const startH = parseInt(daySchedule.start?.split(":")[0] || "9");
                      const endH = parseInt(daySchedule.end?.split(":")[0] || "18");
                      const s = [];
                      for (let h = startH; h < endH; h++) s.push(`${h.toString().padStart(2, "0")}:00`);
                      return s;
                    })()
                  : ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

                return allSlots.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  const isSelected = selectedTime === time;
                  const isFirst = time === firstAvailable && !selectedTime;
                  const durationMins = parseInt(selectedService?.duration || "60");

                  return (
                    <motion.button
                      key={time}
                      whileTap={!isBooked ? { scale: 0.93 } : {}}
                      disabled={isBooked}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      className={`relative rounded-[1.5rem] py-4 px-2 flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                        isBooked
                          ? "bg-stone/20 border-stone/20 cursor-not-allowed opacity-50"
                          : isSelected
                          ? "bg-gradient-to-br from-gold to-amber-600 border-gold text-white shadow-[0_4px_20px_rgba(217,119,6,0.35)]"
                          : isFirst
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-white border-stone/30 text-ink hover:border-gold/30 hover:shadow-sm"
                      }`}
                    >
                      {isFirst && !selectedTime && (
                        <div className="absolute -top-2 -right-1 bg-gold text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                          ✦
                        </div>
                      )}
                      <span className={`text-[15px] font-semibold ${isBooked ? "line-through opacity-50" : ""}`}>
                        {time}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-earth/40"}`}>
                        {durationMins} {t({ mn: "мин", en: "min" })}
                      </span>
                    </motion.button>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* ══ SECTION 4: SUMMARY CARD ══ */}
        <AnimatePresence>
          {selectedService && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-5 pt-6 pb-2"
            >
              <p className="text-[11px] font-semibold text-earth/40 uppercase tracking-[0.2em] mb-4">
                {t({ mn: "4. Баталгаажуулах", en: "4. Review & Confirm" })}
              </p>
              <div className="bg-white rounded-[2rem] border border-stone/20 shadow-sm overflow-hidden">
                {/* Monk banner */}
                <div className="flex items-center gap-4 p-5 border-b border-stone/10">
                  <div className="w-14 h-14 rounded-[1.2rem] overflow-hidden border-2 border-stone/20">
                    <Image src={monk.image || "/default-monk.jpg"} alt={monkName} width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-ink">{monkName}</p>
                    <p className="text-[12px] font-bold text-gold">{selectedSvcName}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[22px] font-semibold text-gold leading-none">₮{Number(selectedService.price).toLocaleString()}</p>
                    {selectedService.duration && (
                      <p className="text-[11px] text-earth/40 font-bold mt-0.5">{selectedService.duration}</p>
                    )}
                  </div>
                </div>

                {/* Date & Time row */}
                <div className="grid grid-cols-2 divide-x divide-stone/10">
                  <div className="p-5">
                    <p className="text-[10px] font-semibold text-earth/30 uppercase tracking-widest mb-1">
                      {t({ mn: "Огноо", en: "Date" })}
                    </p>
                    <p className="text-[15px] font-semibold text-ink">
                      {selectedDate.toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold text-earth/30 uppercase tracking-widest mb-1">
                      {t({ mn: "Цаг", en: "Time" })}
                    </p>
                    <p className="text-[15px] font-semibold text-ink">{selectedTime} · {selectedService.duration || "60 мин"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ CONFIRM CTA (урсгалд — хуанлийг бүрхэхгүй) ══ */}
        <div className="mt-8 border-t border-stone/15 bg-cream px-5 pt-5 pb-2">
          <AnimatePresence mode="wait">
            {step === "error" ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-3 mb-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-[13px] font-bold text-red-600">{errorMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep("select"); setErrorMsg(""); }}
                  className="cta-button w-full py-4 min-h-[52px] rounded-[1.15rem] text-[13px] active:scale-95 transition-all border-0"
                >
                  {t({ mn: "Дахин оролдох", en: "Try Again" })}
                </button>
              </motion.div>
            ) : (
              <motion.div key="confirm" initial={false}>
                {(!selectedService || !selectedTime) && (
                  <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-earth/45">
                    {t({
                      mn: "Үйлчилгээ болон цаг сонгоно уу",
                      en: "Choose a service and a time slot",
                    })}
                  </p>
                )}
                <motion.button
                  type="button"
                  whileTap={selectedService && selectedDate && selectedTime && !submitting ? { scale: 0.97 } : {}}
                  onClick={handleConfirm}
                  disabled={!selectedService || !selectedDate || !selectedTime || submitting}
                  className={`w-full h-16 flex items-center justify-center gap-2 transition-all ${
                    selectedService && selectedDate && selectedTime && !submitting
                      ? "cta-button border-0 shadow-gold rounded-[1.15rem]"
                      : "rounded-[1.15rem] bg-stone/25 text-earth/50 cursor-not-allowed border border-stone/20 font-semibold text-[15px]"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={22} className="animate-spin" />
                      <span>{t({ mn: "Захиалж байна...", en: "Booking..." })}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className={selectedService && selectedDate && selectedTime ? "text-neutral-900" : "text-earth/35"} />
                      <span>{t({ mn: "Захиалга баталгаажуулах", en: "Confirm Booking" })}</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}