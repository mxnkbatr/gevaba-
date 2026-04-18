"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
// 1. Import Clerk Components
import { SignInButton, SignUpButton, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import {
  Flower,
  ArrowRight,
  Sparkles,
  User,
  Loader2 // Spinner icon
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

// --- CUSTOM SVG: The Endless Knot (Background Geometry) ---
const EndlessKnot = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" >
    <path d="M30 30 L70 30 L70 70 L30 70 Z" strokeWidth="0.5" className="opacity-50" />
    <path d="M30 30 Q50 10 70 30 T70 70 Q50 90 30 70 T30 30" strokeWidth="1" />
    <path d="M20 50 L80 50" strokeWidth="0.5" strokeDasharray="2 2" />
    <path d="M50 20 L50 80" strokeWidth="0.5" strokeDasharray="2 2" />
    <circle cx="50" cy="50" r="45" strokeWidth="0.5" className="opacity-30" />
  </svg>
);

export default function LoginPage() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${language}/profile`);
    }
  }, [user, authLoading, router, language]);

  const content = {
    leftTitle: t({ mn: "Дотоод сүмдээ <br/> эргэн ирээрэй", en: "Return to the <br/> Inner Temple" }),
    leftDesc: t({
      mn: "\"Мэргэн ухаан дотроос тань ирдэг. Үүнийг гаднаас бүү хай. Гэгээрлийн зүг аяллаа үргэлжлүүлэхийн тулд нэвтэрнэ үү.\"",
      en: "\"Wisdom comes from within. Do not seek it without. Sign in to continue your journey towards enlightenment.\""
    }),
    welcomeBack: t({ mn: "Тавтай морилно уу", en: "Welcome Back" }),
    identifyDesc: t({ mn: "Нэвтрэхийн тулд өөрийгөө таниулна уу.", en: "Identify yourself to access the mentors and community." }),
    loadingText: t({ mn: "Сүнс сэргэж байна...", en: "Awakening Spirits..." }),
    enterBtn: t({ mn: "Нэвтрэх", en: "Enter" }),
    joinBtn: t({ mn: "Бүртгүүлэх", en: "Join the Community" }),
    or: t({ mn: "- ЭСВЭЛ -", en: "- OR -" }),
    agreeText: t({ mn: "Нэвтэрснээр та ", en: "By entering, you agree to follow the " }),
    eightfoldPath: t({ mn: "Найман зөв зам-ын дагуу байхыг зөвшөөрч байна.", en: "Eightfold Path of Conduct" }),
    forgotPassword: t({ mn: "Нууц үгээ мартсан уу?", en: "Forgot Password?" }),
  };

  return (
    <div className="min-h-screen w-full flex bg-cream font-serif selection:bg-gold/25 selection:text-ink overflow-hidden text-ink">

      {/* --- LEFT SIDE: THE VISUAL SANCTUARY (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#1a0a05]">

        {/* Background Image with Zoom Effect */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1548544149-48bc5e582888?q=80&w=2574&auto=format&fit=crop"
            alt="Monk in Meditation"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a05] via-[#451a03]/50 to-transparent" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 m-auto max-w-lg px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <Flower className="w-16 h-16 text-[#F59E0B] mx-auto mb-8 animate-[spin_60s_linear_infinite]" />
            <h1
              className="text-5xl font-bold text-[#FDE68A] mb-6 drop-shadow-lg"
              dangerouslySetInnerHTML={{ __html: content.leftTitle }}
            />
            <p className="text-[#FDE68A]/70 text-lg leading-relaxed font-sans font-light">
              {content.leftDesc}
            </p>
          </motion.div>
        </div>

        {/* Bottom Quote */}

      </div>


      {/* --- RIGHT SIDE: THE AUTH GATEWAY --- */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12">

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-dark/6 rounded-full blur-[80px] pointer-events-none" />

        {/* Giant Rotating Knot Watermark */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
          className="absolute -right-24 -bottom-24 w-[600px] h-[600px] text-ink/[0.06] pointer-events-none"
        >
          <EndlessKnot className="w-full h-full" />
        </motion.div>


        {/* --- AUTH CARD --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="monastery-card relative z-10 w-full max-w-md bg-white/72 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-gold/16 shadow-gold"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <Link href={`/${language}`} className="inline-flex items-center gap-2 text-gold-dark hover:text-gold-dark/80 transition-colors mb-6 group">
              <Flower size={20} className="group-hover:rotate-180 transition-transform duration-700" />
              <span className="font-bold font-sans uppercase tracking-widest text-xs">Гэвабол</span>
            </Link>
            <h2 className="text-[1.65rem] font-semibold tracking-tight text-ink mb-3 sm:text-3xl">{content.welcomeBack}</h2>
            <p className="text-earth/70 text-sm font-sans leading-relaxed">
              {content.identifyDesc}
            </p>
          </div>

          {/* CLERK LOADING STATE (Prevents hydration mismatch) */}
          <ClerkLoading>
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-gold-dark">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">{content.loadingText}</p>
            </div>
          </ClerkLoading>

          {/* MAIN ACTIONS */}
          <ClerkLoaded>
            <div className="space-y-6">

              {/* 1. SIGN IN (Golden Button) */}
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cta-button relative w-full overflow-hidden rounded-[1.15rem] p-5 min-h-[52px] shadow-xl transition-all group cursor-pointer border-0"
                >
                  {/* Golden Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="flex items-center justify-center gap-3">
                    <span>{content.enterBtn}</span>
                    <ArrowRight size={18} />
                  </div>
                </motion.button>
              </SignInButton>

              <div className="text-center space-y-4">
                <Link
                  href={`/${language}/forgot-password`}
                  className="text-[10px] font-sans text-earth/55 hover:text-gold-dark hover:underline font-semibold uppercase tracking-[0.2em] transition-colors"
                >
                  {content.forgotPassword}
                </Link>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gold/12" /></div>
                  <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-widest"><span className="rounded-full bg-white/70 px-4 py-0.5 text-earth/45 backdrop-blur-sm">{content.or}</span></div>
                </div>
              </div>

              {/* 2. SIGN UP (Outline Button) */}
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl border border-gold/22 bg-cream/60 hover:border-gold/40 hover:bg-white/80 transition-all flex items-center justify-center gap-2 text-ink font-semibold group cursor-pointer shadow-sm"
                >
                  <User size={18} className="text-gold-dark group-hover:scale-110 transition-transform" />
                  <span>{content.joinBtn}</span>
                </motion.button>
              </SignUpButton>

            </div>
          </ClerkLoaded>

          {/* Footer Note */}
          <div className="mt-12 text-center border-t border-gold/12 pt-6">
            <p className="text-earth/60 text-xs font-sans leading-relaxed">
              {content.agreeText}
              <Link href={`/${language}/terms`} className="font-semibold text-gold-dark hover:underline ml-1">
                {content.eightfoldPath}
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
