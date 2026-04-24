"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import QPay from "@/app/components/checkout/QPay";
import { formatDate } from "@/app/lib/dateUtils";

type Step = 1 | 2 | 3 | "success";

const DISTRICTS = [
  "Баянзүрх",
  "Баянгол",
  "Хан-Уул",
  "Сүхбаатар",
  "Сонгинохайрхан",
  "Чингэлтэй",
  "Налайх",
  "Багануур",
  "Багахангай",
] as const;

type District = (typeof DISTRICTS)[number];
type DeliveryState = {
  name: string;
  phone: string;
  address: string;
  district: District;
  note: string;
};

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const { user } = useAuth();
  const { items, totalAmount, totalItems, clearCart } = useCart();

  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(user?.email || "");
  const [delivery, setDelivery] = useState<DeliveryState>({
    name: "",
    phone: "",
    address: "",
    district: DISTRICTS[0],
    note: "",
  });

  const cartProducts = useMemo(() => items.map((it) => it.product), [items]);
  const allDigital = useMemo(
    () => cartProducts.length > 0 && cartProducts.every((p) => p.type === "digital"),
    [cartProducts],
  );
  const deliveryFee = allDigital ? 0 : 5000;
  const grandTotal = totalAmount + deliveryFee;

  const safeItems = useMemo(
    () =>
      items
        .map((it) => ({
          productId: (it.product?._id ?? "").toString(),
          quantity: Math.max(1, Number(it.quantity ?? 1)),
        }))
        .filter((x) => x.productId),
    [items],
  );

  const canContinueStep1 = totalItems > 0;
  const canContinueStep2 = allDigital
    ? true
    : Boolean(
        delivery.name.trim() &&
          delivery.phone.trim() &&
          delivery.address.trim() &&
          delivery.district.trim(),
      );

  const goNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!canContinueStep1) return;
      if (allDigital) setStep(3);
      else setStep(2);
      return;
    }
    if (step === 2) {
      if (!canContinueStep2) {
        setErrorMsg(
          t({
            mn: "Хүргэлтийн мэдээллээ бүрэн бөглөнө үү.",
            en: "Please complete delivery information.",
          }),
        );
        return;
      }
      setStep(3);
    }
  };

  const createOrder = async () => {
    setCreating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: safeItems,
          userEmail: email || user?.email || "",
          deliveryInfo: allDigital
            ? null
            : {
                name: delivery.name,
                phone: delivery.phone,
                address: delivery.address,
                district: delivery.district,
                note: delivery.note || undefined,
              },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Order creation failed");
      setOrderId(data.orderId);
      return data.orderId as string;
    } finally {
      setCreating(false);
    }
  };

  const handleSuccess = async () => {
    try {
      const id = orderId || (await createOrder());
      await fetch(`/api/shop/orders/${id}/confirm`, { method: "POST" }).catch(() => {});
      clearCart();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#ffffff"],
        disableForReducedMotion: true,
      });
      setStep("success");
    } catch (e: any) {
      setErrorMsg(e?.message || t({ mn: "Алдаа гарлаа", en: "Something went wrong" }));
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between gap-3 mb-5">
      {[1, 2, 3].map((n) => {
        const active = step === n;
        const done = typeof step === "number" ? step > n : true;
        return (
          <div key={n} className="flex-1 flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${
                done
                  ? "bg-[var(--color-gold)] text-white"
                  : active
                    ? "bg-white border border-gold/30 text-ink"
                    : "bg-white/60 border border-gold/20 text-earth"
              }`}
            >
              {n}
            </div>
            {n !== 3 && (
              <div className="h-[2px] flex-1 bg-black/[0.06]" />
            )}
          </div>
        );
      })}
    </div>
  );

  if (totalItems === 0 && step !== "success") {
    router.push(`/${lang}/shop`);
  }

  return (
    <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] pb-[calc(env(safe-area-inset-bottom,34px)+96px)]">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => (step === 1 ? router.back() : setStep(1))}
          className="h-11 w-11 rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center"
          aria-label={t({ mn: "Буцах", en: "Back" })}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="app-card-premium p-6 mt-4">
          <h1 className="text-h2" style={{ fontFamily: "var(--font-display)" }}>
            {t({ mn: "Төлбөр хийх", en: "Checkout" })}
          </h1>
          <p className="text-secondary mt-1">
            {t({ mn: "QPay-гаар төлөөд баталгаажуулна.", en: "Pay with QPay to confirm." })}
          </p>

          {step !== "success" && <div className="mt-5"><StepIndicator /></div>}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={(it.product?._id ?? "") as string} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {lang === "mn" ? it.product.name.mn : it.product.name.en}
                        </p>
                        <p className="text-secondary text-xs">
                          {it.quantity} × ₮{Number(it.product.price).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-black">
                        ₮{(Number(it.product.price) * it.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-black/[0.06] bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-secondary font-semibold">{t({ mn: "Дэд дүн", en: "Subtotal" })}</p>
                    <p className="font-black">₮{totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-secondary font-semibold">{t({ mn: "Хүргэлт", en: "Delivery" })}</p>
                    <p className="font-black">₮{deliveryFee.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                    <p className="text-secondary font-semibold">{t({ mn: "Нийт", en: "Total" })}</p>
                    <p className="text-xl font-black text-[var(--color-gold)]">₮{grandTotal.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase opacity-50">{t({ mn: "Имэйл", en: "Email" })}</p>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(191,164,106,0.25)]"
                  />
                </div>

                <button type="button" onClick={goNext} className="btn-primary w-full h-12">
                  {t({ mn: "Үргэлжлэх", en: "Continue" })}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50">Нэр</p>
                    <input
                      value={delivery.name}
                      onChange={(e) => setDelivery((p) => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50">Утасны дугаар</p>
                    <input
                      value={delivery.phone}
                      onChange={(e) =>
                        setDelivery((p) => ({ ...p, phone: e.target.value.replace(/[^\d+]/g, "") }))
                      }
                      inputMode="numeric"
                      className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50">Хаяг</p>
                    <textarea
                      value={delivery.address}
                      onChange={(e) => setDelivery((p) => ({ ...p, address: e.target.value }))}
                      className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none min-h-[96px]"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50">Дүүрэг</p>
                    <select
                      value={delivery.district}
                      onChange={(e) =>
                        setDelivery((p) => ({ ...p, district: e.target.value as District }))
                      }
                      className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50">Тэмдэглэл</p>
                    <input
                      value={delivery.note}
                      onChange={(e) => setDelivery((p) => ({ ...p, note: e.target.value }))}
                      className="mt-1 w-full rounded-2xl bg-white border border-black/[0.06] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                {errorMsg ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <p className="text-sm font-semibold">{errorMsg}</p>
                  </div>
                ) : null}

                <button type="button" onClick={goNext} className="btn-primary w-full h-12">
                  {t({ mn: "Үргэлжлэх", en: "Continue" })}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="space-y-4"
              >
                {!orderId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const id = await createOrder();
                        setOrderId(id);
                      } catch (e: any) {
                        setErrorMsg(e?.message || "Order creation failed");
                      }
                    }}
                    disabled={creating}
                    className="btn-primary w-full h-12"
                  >
                    {creating ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t({ mn: "Захиалга үүсгэж байна...", en: "Creating order..." })}
                      </span>
                    ) : (
                      t({ mn: "Төлбөр эхлүүлэх", en: "Start payment" })
                    )}
                  </button>
                ) : (
                  <QPay
                    orderId={orderId}
                    amount={grandTotal}
                    onSuccess={handleSuccess}
                  />
                )}

                {errorMsg ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <p className="text-sm font-semibold">{errorMsg}</p>
                  </div>
                ) : null}
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-h2 mt-4" style={{ fontFamily: "var(--font-display)" }}>
                  {t({ mn: "Захиалга амжилттай!", en: "Order placed!" })}
                </h2>
                {orderId ? (
                  <p className="text-secondary mt-2 font-mono">
                    #{orderId.slice(-6)} • {formatDate(new Date(), "mn")}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => router.push(`/shop/orders/${orderId}`)}
                    className="btn-primary h-12 px-6"
                    disabled={!orderId}
                  >
                    {t({ mn: "Захиалга харах", en: "View order" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/shop`)}
                    className="btn-secondary h-12 px-6"
                  >
                    {t({ mn: "Дэлгүүр рүү буцах", en: "Back to shop" })}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

