"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/app/lib/dateUtils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

function OrderSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="app-card-premium p-5">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-3 w-44 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function statusUi(status: string) {
  switch (status) {
    case "pending":
      return { cls: "bg-yellow-100 text-yellow-700", label: "Хүлээгдэж буй" };
    case "paid":
    case "processing":
      return { cls: "bg-blue-100 text-blue-700", label: "Боловсруулж байна" };
    case "shipped":
      return { cls: "bg-purple-100 text-purple-700", label: "Хүргэлтэнд" };
    case "delivered":
      return { cls: "bg-green-100 text-green-700", label: "Хүргэгдсэн" };
    case "cancelled":
      return { cls: "bg-red-100 text-red-700", label: "Цуцлагдсан" };
    default:
      return { cls: "bg-black/5 text-earth", label: status };
  }
}

export default function ShopOrdersPage() {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
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
        const res = await fetch("/api/shop/orders", { cache: "no-store" });
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, lang, router]);

  const content = useMemo(() => {
    if (fetching) return <OrderSkeletons />;
    if (orders.length === 0) {
      return (
        <div className="app-card-premium p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-black/[0.04] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-earth" />
          </div>
          <p className="text-h2 mt-4">
            {t({ mn: "Захиалга олдсонгүй", en: "No orders" })}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {orders.map((o) => {
          const st = statusUi(String(o.status ?? ""));
          const count = Array.isArray(o.items) ? o.items.length : 0;
          const firstImg = o.items?.[0]?.image;
          return (
            <button
              key={o._id}
              type="button"
              onClick={() => router.push(`/shop/orders/${o._id}`)}
              className="w-full text-left app-card-premium p-5 active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-secondary text-sm font-semibold">
                  {formatDate(o.createdAt || new Date(), "mn")}
                </p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-ios-grouped overflow-hidden shrink-0">
                    {firstImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstImg} alt="item" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold truncate">
                    {t({ mn: `${count} бүтээгдэхүүн`, en: `${count} items` })}
                  </p>
                </div>
                <p className="text-sm font-black text-[var(--color-gold-dark)]">
                  ₮{Number(o.totalAmount ?? 0).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }, [fetching, orders, router, t]);

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-h1 mb-4" style={{ fontFamily: "var(--font-display)" }}>
          {t({ mn: "Миний захиалгууд", en: "My orders" })}
        </h1>
        {content}
      </div>
    </div>
  );
}

