"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import {
  Users, Zap, Lock, Globe,
  Compass,
  ArrowRight,
  Orbit
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import OptimizedVideo from "../../components/OptimizedVideo";

// ==========================================
// 1. AESTHETIC UTILS
// ==========================================

// Adds a subtle paper/film texture overlay
const GrainOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.022] mix-blend-multiply">
    <svg className="h-full w-full">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

// Smooth Blur-In Text Animation
const BlurReveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 2. MAIN PAGE
// ==========================================

export default function AboutPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  // Global Scroll Hooks
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1.1, 1]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], ["0%", "20%"]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // --- FORCE LIGHT MODE ---
  const isDark = false; // resolvedTheme === "dark";

  const theme = isDark ? {
    bg: "bg-[#05050a]",
    bgSection: "bg-[#0a0a1a]",
    text: "text-amber-50",
    textMuted: "text-amber-100/60",
    accent: "text-amber-400",
    cardBg: "bg-[#0f0f2a]/60",
    cardBorder: "border-indigo-500/20",
    gradientOverlay: "from-[#05050a]/80"
  } : {
    bg: "bg-cream",
    bgSection: "bg-white/35",
    text: "text-ink",
    textMuted: "text-earth/65",
    accent: "text-gold-dark",
    cardBg: "bg-white/90",
    cardBorder: "border-gold/18",
    gradientOverlay: "from-cream/92"
  };

  // Added hex colors to the original array for the spotlight effect
  const cards = [
    {
      title: t({ mn: "Мэргэжлийн Баг", en: "Expert Guidance" }),
      desc: t({ mn: "Туршлагатай зурхайч, лам нар танд үйлчилнэ.", en: "Experienced masters guiding your path." }),
      icon: <Users />,
      colorClass: "text-orange-500",
      hex: "249, 115, 22" // Orange RGB
    },
    {
      title: t({ mn: "Цаг Хугацаа", en: "Anytime Access" }),
      desc: t({ mn: "Дэлхийн хаанаас ч холбогдох боломжтой.", en: "Connect instantly from anywhere on Earth." }),
      icon: <Globe />,
      colorClass: "text-blue-500",
      hex: "59, 130, 246" // Blue RGB
    },
    {
      title: t({ mn: "Нууцлал", en: "Full Privacy" }),
      desc: t({ mn: "Таны мэдээлэл бүрэн хамгаалагдана.", en: "Your sessions are strictly confidential." }),
      icon: <Lock />,
      colorClass: "text-emerald-500",
      hex: "16, 185, 129" // Emerald RGB
    },
    {
      title: t({ mn: "Хялбар Шийдэл", en: "Seamless Tech" }),
      desc: t({ mn: "Цахим төлбөр, хялбар захиалгын систем.", en: "Effortless booking & secure payments." }),
      icon: <Zap />,
      colorClass: "text-amber-500",
      hex: "245, 158, 11" // Amber RGB
    }
  ];

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-x-hidden font-sans`}
    >
      <GrainOverlay />

      {/* Top Scroll Indicator */}
      <motion.div
        className={`fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-[100]`}
        style={{ scaleX: scrollYProgress }}
      />

      <AnimatePresence>
        {mounted && (
          <main className="relative z-10">

            {/* --- HERO SECTION --- */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
              {/* Background Video Parallax */}
              <motion.div style={{ scale: heroScale, y: heroY }} className="absolute inset-0 z-0">
                <OptimizedVideo
                  src="https://res.cloudinary.com/dxoxdiuwr/video/upload/v1768133950/num2_ocygii.mp4"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover opacity-60"
                  useNative={true}
                />
              </motion.div>

              {/* Gradient Overlays (Matches original theme colors) */}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/80' : 'from-white/90'} via-transparent to-transparent z-10`} />

              {/* Content */}
              <div className="relative z-20 text-center container px-4 space-y-8">
                <BlurReveal className="flex justify-center">
                  <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 ${theme.cardBg} ${theme.cardBorder}`}>
                    <Orbit size={14} className={theme.accent} />
                    <span className={`text-xs uppercase tracking-[0.2em] font-bold ${theme.accent}`}>Our Story</span>
                  </div>
                </BlurReveal>

                <h1 className="text-6xl md:text-9xl font-serif font-semibold tracking-tight leading-[0.9]">
                  <BlurReveal delay={0.1}>
                    {t({ mn: "Өв Соёл", en: "Heritage" })}
                  </BlurReveal>
                  <BlurReveal delay={0.2} className={`italic font-light ${theme.accent}`}>
                    {t({ mn: "& Технологи", en: "& Future" })}
                  </BlurReveal>
                </h1>

                <BlurReveal delay={0.4} className="mt-8 max-w-2xl mx-auto">
                  <p className={`text-lg md:text-2xl font-light leading-relaxed ${theme.textMuted}`}>
                    {t({
                      mn: "Эртний мэргэн ухааныг орчин үеийн технологитой хослуулан, хүн бүрт хүртээмжтэй түгээх нь бидний зорилго.",
                      en: "Bridging ancient wisdom with modern technology to bring clarity to the digital age."
                    })}
                  </p>
                </BlurReveal>
              </div>
            </section>

            {/* --- STICKY STORY SECTION (Updated Layout / Original Colors) --- */}
            <section className={`relative py-32 px-6 ${theme.bgSection}`}>
              <div className="container mx-auto max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-20">

                  {/* Sticky Left Text */}
                  <div className="lg:w-1/2 h-fit lg:sticky lg:top-32 space-y-10">
                    <BlurReveal>
                      <h2 className="text-4xl md:text-7xl font-serif font-bold leading-[0.9]">
                        {t({ mn: "Бидний Эрхэм", en: "Our Noble" })} <br />
                        <span className={`italic ${theme.accent}`}>{t({ mn: "Зорилго", en: "Mission" })}</span>
                      </h2>
                    </BlurReveal>

                    <BlurReveal delay={0.2} className={`space-y-6 text-lg leading-relaxed ${theme.textMuted}`}>
                      <p>
                        {t({
                          mn: "Бид Монголын Бурхан шашны олон зуун жилийн түүхтэй зан үйл, сургаал номлолыг цаг хугацаа, орон зайнаас үл хамааран хүн бүрт хүртээмжтэй болгохыг зорьдог.",
                          en: "We aim to make centuries-old Mongolian Buddhist rituals accessible to everyone, transcending the barriers of time and space."
                        })}
                      </p>
                      <div className={`pl-6 border-l-2 border-amber-500/30`}>
                        <p className="font-bold italic text-xl">
                          &quot;{t({ mn: "Мэргэн ухаан таны гарт.", en: "Wisdom in your hands." })}&quot;
                        </p>
                      </div>
                    </BlurReveal>

                    <BlurReveal delay={0.4}>
                      <button className={`group flex items-center gap-3 text-sm uppercase tracking-widest font-bold ${theme.text} opacity-70 hover:opacity-100 transition-opacity mt-8`}>
                        Read the Manifesto <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                      </button>
                    </BlurReveal>
                  </div>

                  {/* Right Scrolling Visuals */}
                  <div className="lg:w-1/2 flex flex-col gap-32 pt-10 lg:pt-32">
                    <ParallaxImage src="/monk3.png" alt="Meditation" />

                    <div className="space-y-6">
                      <h3 className="text-3xl font-serif font-bold">Bridging Eras</h3>
                      <p className={theme.textMuted}>
                        Just as incense fills a room, we believe spiritual guidance should permeate your life, regardless of where you reside physically.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <StatBox number="120+" label="Masters" theme={theme} />
                      <StatBox number="5K+" label="Seekers" theme={theme} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* --- CARDS SECTION (New Effect / Original Colors) --- */}
            <section className="relative py-40 overflow-hidden">
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                  <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}>
                    <h2 className="text-4xl md:text-7xl font-serif font-semibold mb-6">{t({ mn: "Давуу Тал", en: "Why Choose Us" })}</h2>
                    <div className={`w-24 h-1 mx-auto ${isDark ? 'bg-amber-500' : 'bg-gold-dark/28'} opacity-90`} />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cards.map((card, i) => (
                    <SpotlightCard key={i} card={card} index={i} theme={theme} />
                  ))}
                </div>
              </div>
            </section>

          </main>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 3. COMPONENTS
// ==========================================

const ParallaxImage = ({ src, alt }: { src: string, alt: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.2]);

  return (
    <div ref={ref} className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-2xl">
      <motion.img
        style={{ y, scale }}
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};

const StatBox = ({ number, label, theme }: { number: string, label: string, theme: any }) => (
  <div className={`p-8 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-sm hover:shadow-lg transition-shadow duration-300`}>
    <div className={`text-4xl font-serif font-bold ${theme.accent} mb-2`}>{number}</div>
    <div className={`text-[10px] uppercase tracking-widest font-bold opacity-50 ${theme.text}`}>{label}</div>
  </div>
);

// High-end spotlight effect that respects specific card colors
function SpotlightCard({ card, index, theme }: { card: any, index: number, theme: any }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      onMouseMove={handleMouseMove}
      className={`group relative h-[360px] rounded-[2rem] border ${theme.cardBorder} ${theme.cardBg} overflow-hidden`}
    >
      {/* Dynamic Colored Spotlight based on card.hex */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(${card.hex}, 0.10),
              transparent 80%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative h-full p-8 flex flex-col justify-between z-10">
        <div className="space-y-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${theme.cardBorder} ${card.colorClass} bg-current/5`}>
            {React.cloneElement(card.icon, { size: 28, strokeWidth: 1.5 })}
          </div>

          <h3 className={`text-2xl font-bold ${theme.text} leading-tight`}>
            {card.title}
          </h3>

          <div className={`h-px w-10 bg-current opacity-10`} />

          <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
            {card.desc}
          </p>
        </div>

        {/* Floating Number at bottom */}
        <div className="flex justify-between items-end">
          <span className="text-4xl font-semibold opacity-[0.06] select-none">0{index + 1}</span>
          <div className={`p-2 rounded-full bg-current/5 ${card.colorClass} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0`}>
            <Compass size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}