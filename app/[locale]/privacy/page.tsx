"use client";

import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen bg-cream text-ink selection:bg-gold/20">
      <div className="pointer-events-none absolute -top-24 left-[-18%] h-[min(40vh,360px)] w-[min(85vw,400px)] rounded-full bg-emerald-500/6 blur-[90px]" />
      <div className="container relative z-10 mx-auto max-w-3xl px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[calc(var(--header-height-mobile,84px)+env(safe-area-inset-top,0px)+1.5rem)] sm:px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/18 bg-white/90 shadow-gold">
            <Lock size={28} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-dark/85">
            {t({ mn: "Нууцлал", en: "Privacy" })}
          </p>
          <h1 className="font-serif text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.5rem] md:text-[2.75rem]">
            {t({ mn: "Нууцлал", en: "Full Privacy" })}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-earth/65">
            {t({ mn: "Таны мэдээлэл бүрэн хамгаалагдана.", en: "Your sessions are strictly confidential." })}
          </p>
        </div>
        <div className="monastery-card space-y-8 rounded-[1.75rem] border border-gold/14 bg-white/88 p-8 text-[15px] leading-[1.75] text-earth/80 shadow-gold backdrop-blur-sm md:p-12 md:text-[16px]">
          <p>
            {t({
              mn: "Тибет аппликейшн нь хэрэглэгчийн мэдээллийн нууцлалыг чандлан хадгалах бөгөөд гуравдагч этгээдэд дамжуулахгүй болно. Бүх зан үйл болон үзмэрчтэй хийсэн уулзалт нь зөвхөн таны болон үзмэрчийн дунд үлдэнэ.",
              en: "The Tibetan application strictly maintains the privacy of user data and will not share it with third parties. All rituals and sessions with masters remain strictly between you and the guide."
            })}
          </p>
          <p>
            {t({
              mn: "Бид таны хувийн мэдээллийг зөвхөн үйлчилгээ үзүүлэх, аппликейшны хэвийн үйл ажиллагааг хангахад зориулан ашиглана.",
              en: "We use your personal data solely to provide the requested services and to ensure the proper functioning of the application."
            })}
          </p>
        </div>
      </div>
    </div>
  );
}



