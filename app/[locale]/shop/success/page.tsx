"use client";

import React from "react";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function ShopSuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+88px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      <div className="mx-auto w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="app-card-premium p-8 text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-h2 mt-4" style={{ fontFamily: "var(--font-display)" }}>
            {t({ mn: "Захиалга баталгаажлаа", en: "Order confirmed" })}
          </h1>
          <p className="text-secondary mt-2">
            {t({
              mn: "Таны төлбөр амжилттай хийгдлээ. Баярлалаа.",
              en: "Your payment was successful. Thank you.",
            })}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <LocalizedLink href="/shop">
              <button type="button" className="btn-primary h-12 px-6">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  {t({ mn: "Дэлгүүр рүү", en: "Back to shop" })}
                </span>
              </button>
            </LocalizedLink>
            <LocalizedLink href="/">
              <button type="button" className="btn-secondary h-12 px-6">
                {t({ mn: "Нүүр", en: "Home" })}
              </button>
            </LocalizedLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

