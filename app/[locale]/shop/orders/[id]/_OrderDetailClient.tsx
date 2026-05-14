"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/app/lib/dateUtils";

export default function ShopOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { language: lang, t } = useLanguage();
  const { user, loading } = useAuth();

  const id = (Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id) as string;

  const [order, setOrder] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/${lang}/login`);
      return;
    }

    let cancelled = false;
    (async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/shop/orders/${id}`, { cache: "no-store" });
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setOrder(data);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, id, lang, router]);

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center"
          aria-label={t({ mn: "Буцах", en: "Back" })}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="app-card-premium p-6 mt-4">
          {fetching ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : !order ? (
            <p className="text-h2">{t({ mn: "Захиалга олдсонгүй", en: "Order not found" })}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label">{t({ mn: "Захиалга", en: "Order" })}</p>
                  <p className="text-h2 font-mono">#{String(order._id).slice(-6)}</p>
                  <p className="text-secondary mt-1">
                    {formatDate(order.createdAt || new Date(), "mn")}
                  </p>
                </div>
                <p className="text-lg font-black text-[var(--color-gold-dark)]">
                  ₮{Number(order.totalAmount ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                {(order.items ?? []).map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold truncate">
                      {lang === "mn" ? it?.name?.mn : it?.name?.en}
                      <span className="text-secondary font-bold"> × {it.quantity}</span>
                    </p>
                    <p className="text-sm font-black">
                      ₮{Number(it.price * it.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
