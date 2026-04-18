"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  AnimatePresence
} from "framer-motion";
import {
  Heart,
  Globe,
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  HandHeart,
  ArrowDown,
  Infinity as InfinityIcon,
  Star,
  Eye
} from "lucide-react";
import GoldenNirvanaFooter from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "next-themes";

// --- CUSTOM SVG: The Endless Knot ---
const EndlessKnot = ({ isNight }: { isNight: boolean }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full transition-colors duration-1000 ${isNight ? "text-indigo-500/20" : "text-amber-500/10"}`} fill="none" stroke="currentColor">
     <path d="M30 30 L70 30 L70 70 L30 70 Z" strokeWidth="0.5" className="opacity-50" />
     <path d="M30 30 Q50 10 70 30 T70 70 Q50 90 30 70 T30 30" strokeWidth="1" />
     <path d="M20 50 L80 50" strokeWidth="0.5" strokeDasharray="2 2" />
     <path d="M50 20 L50 80" strokeWidth="0.5" strokeDasharray="2 2" />
     <circle cx="50" cy="50" r="45" strokeWidth="0.5" className="opacity-30" />
  </svg>
);

export default function MissionPage() {
  const { t, language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hydration safety
  useEffect(() => setMounted(true), []);

  // Mouse Physics
  const mouseX = useSpring(0, { stiffness: 40, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 40, damping: 20 });

  const isNight = mounted && resolvedTheme === "dark";
  const glowColor = isNight ? 'rgba(79, 70, 229, 0.15)' : 'rgba(251, 191, 36, 0.2)';
  const lightBackground = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 80%)`;

  const theme = isNight ? {
    bgMain: "bg-[#020205]",
    bgSec: "bg-[#05051a]",
    textMain: "text-indigo-50",
    textSub: "text-indigo-400",
    accent: "text-amber-400",
    border: "border-indigo-500/20",
    cardBg: "bg-black/40",
    icon: <Moon size={24} fill="currentColor" className="animate-pulse" />
  } : {
    bgMain: "bg-cream",
    bgSec: "bg-white/40",
    textMain: "text-ink",
    textSub: "text-gold-dark",
    accent: "text-gold-dark",
    border: "border-gold/20",
    cardBg: "bg-white/88",
    icon: <Sun size={24} className="animate-spin-slow" />
  };

  const content = {
    heroTag: t({ mn: "Цаг хугацаа үгүй, орон зай үгүй", en: "Beyond Time and Space" }),
    heroHeadline1: t({ mn: "Цаг хугацаа, орон зайг", en: "Transcending" }),
    heroHeadline2: t({ mn: "үл хамааран", en: "Everywhere" }),
    heroSubtitle: t({ mn: "Оюун санааны гэгээрлийг танд түгээнэ.", en: "Distributing the light of inner wisdom." }),
    missionTag: t({ mn: "Бидний Эрхэм Зорилго", en: "Our  Mission" }),
    missionTitle: t({ mn: "Мэргэн ухааны үрийг тарих", en: "Planting Seeds of Wisdom" }),
    stats: [
      { number: "24/7", label: t({ mn: "Онлайн Зөвлөгөө", en: "Daily Guide" }), icon: <Star /> },
      { number: "108+", label: t({ mn: "Ном Судар", en: "Ancient Teachings" }), icon: <BookOpen /> },
      { number: "50+", label: t({ mn: "Багш нар", en: "Experienced Teachers" }), icon: <Eye /> },
      { number: "∞", label: t({ mn: "Endless Wisdom", en: "Endless Wisdom" }), icon: <InfinityIcon /> }
    ],
  };

  if (!mounted) return <div className="min-h-screen bg-cream" />;

  return (
    <>
      <main 
        ref={containerRef}
        onMouseMove={(e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); }}
        className={`relative w-full min-h-screen transition-colors duration-1000 font-sans overflow-hidden ${theme.bgMain} ${theme.textMain}`}
      >
        {/* ATMOSPHERE */}
        <motion.div className="fixed inset-0 pointer-events-none z-10 opacity-50 mix-blend-screen blur-3xl" style={{ background: lightBackground }} />
        <div className={`fixed inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay ${isNight ? 'opacity-[0.2]' : 'opacity-[0.055]'}`} />


        {/* --- SECTION 1: THE GREAT VOW (Hero) --- */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6"> 
           
           <motion.div 
             animate={{ rotate: isNight ? -360 : 360 }}
             transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vh] pointer-events-none"
           >
              <EndlessKnot isNight={isNight} />
           </motion.div>

           <div className="relative z-10 text-center max-w-6xl space-y-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-md transition-colors ${theme.border}`}>
                 <div className={isNight ? "text-indigo-400" : "text-amber-600"}>
                   <InfinityIcon size={14} />
                 </div>
                 <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-70">
                    {content.heroTag}
                 </span>
              </motion.div>

              <h1 className="text-6xl md:text-9xl font-bold leading-none tracking-tighter">
                {content.heroHeadline1} <br />
                <span className="italic text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-orange-600">
                   {content.heroHeadline2}
                </span>
              </h1>

              <p className={`text-2xl md:text-4xl font-serif font-light max-w-3xl mx-auto leading-relaxed transition-colors ${isNight ? 'text-indigo-200/60' : 'text-amber-900/60'}`}>
                {content.heroSubtitle}
              </p>
           </div>

           <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className={`absolute bottom-12 transition-colors ${theme.accent}`}>
             <ArrowDown size={32} strokeWidth={1} />
           </motion.div>
        </section>


        {/* --- SECTION 2: THE SACRED GOAL (Artifact Rows) --- */}
        <section className={`relative py-48 transition-colors duration-1000 ${theme.bgSec}`}> 
           <div className="container mx-auto px-6 lg:px-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                 <div className="space-y-12">
                     <span className={`text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 ${theme.textSub}`}>
                        {theme.icon} {content.missionTag}
                     </span>
                     <h2 className="text-5xl md:text-7xl font-bold leading-tight">
                        {content.missionTitle}
                     </h2>
                     <div className={`w-32 h-[1px] bg-linear-to-r from-current to-transparent ${theme.accent}`} />
                     <p className={`text-xl md:text-2xl leading-relaxed font-medium transition-colors italic ${isNight ? 'text-indigo-100/70' : 'text-amber-950/70'}`}>
                        {t({
                          mn: "Бид технологийн дэвшлийг ашиглан оюун санааны зөвлөгөөг таны дэргэд авчирч байна.",
                          en: "We breathe life into ancient lineage through digital ethers, bringing the stillness of the monastery directly to your side."
                        })}
                     </p>
                 </div>

                 <div className="grid grid-cols-1 gap-8">
                     <MissionArtifact 
                        icon={<Sparkles />}
                        title={t({ mn: "Гэрээсээ холбогд", en: "Digital Presence" })}
                        desc={t({ mn: "Видео дуудлагаар багштайгаа шууд уулзах боломж.", en: "Face-to-face  connection via the digital portal." })}
                        isNight={isNight}
                        theme={theme}
                     />
                     <MissionArtifact 
                        icon={<Eye />}
                        title={t({ mn: "Засал ном", en: " Rituals" })}
                        desc={t({ mn: "Уламжлалт зан үйлийг байгаа газраасаа авах.", en: "Receive traditional remedies at your sanctuary of choice." })}
                        isNight={isNight}
                        theme={theme}
                     />
                 </div>
              </div>
           </div>
        </section>


        {/* --- SECTION 3: THE IMPACT ORBS --- */}
        <section className="relative py-48 overflow-hidden">
           <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none">
              <EndlessKnot isNight={isNight} />
           </div>
           
           <div className="container mx-auto px-6 relative z-10 text-center">
              <header className="max-w-4xl mx-auto mb-32">
                 <h2 className="text-5xl md:text-8xl font-bold mb-8">
                    The Global Community
                 </h2>
                 <p className={`text-2xl font-serif italic ${isNight ? 'text-indigo-400' : 'text-amber-600'}`}>
                    "Gevabal at your fingertips"
                 </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                 {content.stats.map((stat, idx) => (
                   <StatOrb key={idx} {...stat} isNight={isNight} theme={theme} delay={idx * 0.1} />
                 ))}
              </div>
           </div>
        </section>


        {/* --- SECTION 4: THE VOID QUOTE --- */}
        <section className={`relative py-40 transition-colors duration-1000 ${isNight ? "bg-black" : "bg-ink"} text-cream`}>
           <div className="container mx-auto px-6 text-center max-w-5xl">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} className="mb-12">
                 <HandHeart className="w-16 h-16 mx-auto text-gold-light" />
              </motion.div>
              
              <p className="text-3xl md:text-5xl font-serif font-light leading-snug drop-shadow-2xl italic">
                 {language === 'mn' ? "\"Гэгээрэл гаднаас ирдэггүй, дотроосоо ундардаг.\"" : "\"Wisdom is not found in the world, but within the observer.\""}
              </p>

              <div className={`mt-20 pt-10 border-t ${isNight ? 'border-indigo-500/20' : 'border-white/10'}`}>
                 <span className="text-xs uppercase tracking-[0.6em] text-amber-500 opacity-60">
                    Gandan Archives
                 </span>
              </div>
           </div>
        </section>

      </main>
    </>
  );
}


// --- ARTISTIC SUB-COMPONENTS ---

function MissionArtifact({ icon, title, desc, isNight, theme }: any) {
   return (
      <motion.div 
        whileHover={{ scale: 1.02, x: 10 }}
        className={`flex items-center gap-8 p-10 rounded-sm border-2 transition-all duration-700 ${theme.cardBg} ${theme.border}`}
      >
         <div className={`w-16 h-16 rounded-full border flex items-center justify-center transition-colors duration-1000 ${isNight ? "border-indigo-400 bg-indigo-950 text-indigo-300" : "border-amber-300 bg-amber-50 text-amber-600"}`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
         <div>
            <h4 className="text-3xl font-bold mb-2 tracking-tight">{title}</h4>
            <p className={`text-base font-medium opacity-60`}>{desc}</p>
         </div>
      </motion.div>
   )
}

function StatOrb({ number, label, icon, theme, delay, isNight }: any) {
   return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 1 }}
        whileHover={{ y: -15 }}
        className={`flex flex-col items-center justify-center p-14 rounded-[3rem] border-2 shadow-2xl transition-all duration-1000 ${theme.cardBg} ${theme.border}`}
      >
         <div className={`${isNight ? 'text-indigo-400' : 'text-amber-500'} mb-6`}>{React.cloneElement(icon, { size: 40 })}</div>
         <span className="text-5xl font-black mb-4">{number}</span>
         <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{label}</span>
         
         {/* Glass Glare */}
         <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />
      </motion.div>
   )
}