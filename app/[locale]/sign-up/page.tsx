"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ClerkLoaded, useSignUp } from "@clerk/nextjs";
import { Loader2, ShieldCheck, User, ScrollText, Home } from "lucide-react";

import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user, login, loading: authLoading } = useAuth();

  const [role, setRole] = useState<"client" | "monk">("client");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${language}/profile`);
    }
  }, [user, authLoading, router, language]);

  const formatPhoneNumber = (phone: string) => {
    const clean = phone.replace(/\s+/g, "");
    if (/^\d{8}$/.test(clean)) return `+976${clean}`;
    if (!clean.startsWith("+")) return `+${clean}`;
    return clean;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      if (role === "client") {
        const res = await fetch("/api/auth/client-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            password,
            email: email || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        await login({ identifier: formattedPhone, password });
        router.push(`/${language}/profile`);
      } else {
        if (!pendingVerification) {
          const signUpParams: Record<string, unknown> = {
            phoneNumber: formattedPhone,
            password,
            unsafeMetadata: { role },
          };
          if (email) signUpParams.emailAddress = email;

          await signUp.create(signUpParams as any);
          await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
          setPendingVerification(true);
        } else {
          const completeSignUp = await signUp.attemptPhoneNumberVerification({ code: otp });
          if (completeSignUp.status === "complete") {
            await setActive({ session: completeSignUp.createdSessionId });
            router.push(`/${language}/onboarding/monk`);
          } else {
            throw new Error("Verification failed. Please check the code.");
          }
        }
      }
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].longMessage : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full min-h-[50px] rounded-xl border-0 bg-[#F2F2F7] px-4 text-[17px] text-ink placeholder:text-earth/45 outline-none transition-shadow focus:bg-[#EAEAEC] focus:shadow-[inset_0_0_0_2px_rgba(0,122,255,0.35)]";

  const content = {
    welcome: t({ mn: "Бүртгүүлэх", en: "Create Account" }),
    instruction: t({ mn: "Төрлөө сонгоод мэдээллээ оруулна уу", en: "Choose your path and enter your details." }),
    roleClient: t({ mn: "Сүсэгтэн", en: "Seeker" }),
    roleClientDesc: t({ mn: "Засал захиалах, багш нартай холбогдох", en: "Book rituals and message guides" }),
    roleMonk: t({ mn: "Лам / Үзмэрч", en: "Monk / Guide" }),
    roleMonkDesc: t({ mn: "Үйлчилгээ үзүүлж сүсэгтэнд туслах", en: "Offer services to the community" }),
    registerBtn: t({ mn: "Бүртгүүлэх", en: "Sign up" }),
    verifyBtn: t({ mn: "Баталгаажуулах", en: "Verify code" }),
    loginBtn: t({ mn: "Нэвтрэх", en: "Sign in" }),
    haveAccount: t({ mn: "Хаягтай юу?", en: "Already have an account?" }),
    emailOpt: t({ mn: "Имэйл (сонголттой)", en: "Email (optional)" }),
  };

  const roleCardBase =
    "relative w-full rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.99]";
  const roleUnselected = "bg-[#F2F2F7] shadow-none";
  const roleSelected =
    "bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] ring-2 ring-gold/55";

  return (
    <div className="min-h-[100svh] bg-[#F2F2F7] text-ink antialiased selection:bg-black/10">
      <main
        className="mx-auto flex min-h-[100svh] w-full max-w-[400px] flex-col px-4 sm:px-5"
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <header className="flex items-center pt-1 pb-2">
          <Link
            href={`/${language}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-ink transition-colors active:bg-black/[0.1] active:scale-[0.97]"
            aria-label={t({ mn: "Нүүр", en: "Home" })}
          >
            <Home size={20} strokeWidth={1.75} />
          </Link>
        </header>

        <div className="flex flex-col items-center pb-6 pt-2 text-center">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-white text-earth shadow-[0_8px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <User size={32} strokeWidth={1.35} />
          </motion.div>
          <p className="text-[13px] font-medium text-earth">
            {t({ mn: "Шинэ эхлэл", en: "Get started" })}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
            {content.welcome}
          </h1>
          <p className="mx-auto mt-2 max-w-[20rem] text-[15px] leading-relaxed text-earth">
            {content.instruction}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] sm:p-6"
        >
          {!pendingVerification && (
            <div className="mb-6 flex flex-col gap-3">
              <p className="text-[13px] font-medium text-earth">
                {t({ mn: "Төрөл", en: "Account type" })}
              </p>
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`${roleCardBase} ${role === "client" ? roleSelected : roleUnselected}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      role === "client"
                        ? "bg-gradient-to-b from-gold-light via-gold to-gold-dark text-ink shadow-sm"
                        : "bg-black/[0.06] text-earth/60"
                    }`}
                  >
                    <User size={20} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1 pr-7">
                    <div className="text-[16px] font-semibold tracking-tight text-ink">{content.roleClient}</div>
                    <p className="mt-0.5 text-[13px] leading-snug text-earth">{content.roleClientDesc}</p>
                  </div>
                </div>
                {role === "client" && (
                  <div className="absolute right-3 top-3 text-gold drop-shadow-[0_0_8px_rgba(255,220,140,0.45)]">
                    <ShieldCheck size={20} strokeWidth={1.75} />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRole("monk")}
                className={`${roleCardBase} ${role === "monk" ? roleSelected : roleUnselected}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      role === "monk"
                        ? "bg-gradient-to-b from-gold-light via-gold to-gold-dark text-ink shadow-sm"
                        : "bg-black/[0.06] text-earth/60"
                    }`}
                  >
                    <ScrollText size={20} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1 pr-7">
                    <div className="text-[16px] font-semibold tracking-tight text-ink">{content.roleMonk}</div>
                    <p className="mt-0.5 text-[13px] leading-snug text-earth">{content.roleMonkDesc}</p>
                  </div>
                </div>
                {role === "monk" && (
                  <div className="absolute right-3 top-3 text-gold drop-shadow-[0_0_8px_rgba(255,220,140,0.45)]">
                    <ShieldCheck size={20} strokeWidth={1.75} />
                  </div>
                )}
              </button>
            </div>
          )}

          <ClerkLoaded>
            <form onSubmit={handleSignUp} className="space-y-4">
              {!pendingVerification && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-earth pl-0.5">
                      {t({ mn: "Утасны дугаар", en: "Phone Number" })}
                    </label>
                    <input
                      type="tel"
                      placeholder={t({ mn: "99001122", en: "99001122" })}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={fieldClass}
                      required
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-earth pl-0.5">{content.emailOpt}</label>
                    <input
                      type="email"
                      placeholder={t({ mn: "name@example.com", en: "name@example.com" })}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-earth pl-0.5">
                      {t({ mn: "Нууц үг", en: "Password" })}
                    </label>
                    <input
                      type="password"
                      placeholder={t({ mn: "Дор хаяж 6 тэмдэгт", en: "At least 6 characters" })}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={fieldClass}
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {pendingVerification && (
                <div className="rounded-xl bg-[#F2F2F7] p-5 text-center">
                  <p className="mb-3 text-[14px] font-medium text-ink leading-snug">
                    {t({ mn: "Таны утас руу илгээсэн кодыг оруулна уу", en: "Enter the code sent to your phone." })}
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`${fieldClass} min-h-[56px] text-center text-[22px] font-medium tracking-[0.35em]`}
                    autoFocus
                    required
                  />
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[#FFEBEA] px-4 py-3 text-center text-[14px] text-[#C62828]"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#1D1D1F] text-[17px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-45"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={22} strokeWidth={2} />
                ) : (
                  <span>{pendingVerification ? content.verifyBtn : content.registerBtn}</span>
                )}
              </button>
            </form>

            {!pendingVerification && (
              <div className="mt-8 border-t border-black/[0.08] pt-7 text-center">
                <p className="text-[15px] text-earth">{content.haveAccount}</p>
                <Link
                  href={`/${language}/sign-in`}
                  className="mt-2 inline-block text-[15px] font-semibold text-[#007AFF] active:opacity-60"
                >
                  {content.loginBtn}
                </Link>
              </div>
            )}
          </ClerkLoaded>
        </motion.div>

        <p className="mt-auto pt-8 text-center text-[12px] text-earth/70">
          {t({ mn: "Бүртгүүлснээр та манай нөхцөлийг зөвшөөрнө.", en: "By signing up you agree to our Terms." })}{" "}
          <Link href={`/${language}/terms`} className="text-[#007AFF] active:opacity-60">
            {t({ mn: "Нөхцөл", en: "Terms" })}
          </Link>
        </p>
      </main>
    </div>
  );
}
