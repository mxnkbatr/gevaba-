"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2, Eye, EyeOff, Home } from "lucide-react";
import type { PhoneCodeFactor } from "@clerk/types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

function SignInPageInner() {
  const { t, language } = useLanguage();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const postAuthPath = React.useCallback(() => {
    const raw = searchParams.get("next")?.trim();
    if (!raw || !raw.startsWith("/")) return `/${language}/profile`;
    if (raw.includes("//") || raw.includes("..")) return `/${language}/profile`;
    if (raw.startsWith(`/${language}`)) return raw;
    return `/${language}/profile`;
  }, [searchParams, language]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!authLoading && user) router.replace(postAuthPath());
  }, [user, authLoading, router, postAuthPath]);

  const formatId = (v: string) => {
    const c = v.replace(/\s+/g, "");
    if (c.includes("@")) return c;
    if (/^\d{8}$/.test(c)) return `+976${c}`;
    if (/^\d+$/.test(c) && !c.startsWith("+")) return `+${c}`;
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setError("");
    const fmtId = formatId(identifier);

    try {
      if (showOtpInput) {
        const r = await signIn!.attemptFirstFactor({ strategy: "phone_code", code: otp });
        if (r.status === "complete") {
          await setActive!({ session: r.createdSessionId });
          router.replace(postAuthPath());
        }
        setLoading(false); return;
      }

      try {
        await login({ identifier: fmtId, password });
        router.replace(postAuthPath()); return;
      } catch (dbErr: any) {
        if (dbErr.message === "Invalid password") {
          setError(t({ mn: "Нууц үг буруу байна", en: "Incorrect password" }));
          setLoading(false); return;
        }
      }

      const r = await signIn!.create({ identifier: fmtId, password });
      if (r.status === "complete") {
        await setActive!({ session: r.createdSessionId });
        router.replace(postAuthPath());
      } else if (r.status === "needs_first_factor") {
        const pf = r.supportedFirstFactors?.find(f => f.strategy === "phone_code") as PhoneCodeFactor | undefined;
        if (pf) {
          await signIn!.prepareFirstFactor({ strategy: "phone_code", phoneNumberId: pf.phoneNumberId });
          setShowOtpInput(true);
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || t({ mn: "Нэвтрэхэд алдаа гарлаа", en: "Sign in failed" }));
    } finally { setLoading(false); }
  };

  const fieldClass =
    "w-full min-h-[50px] rounded-xl border-0 bg-[#F2F2F7] px-4 text-[17px] text-ink placeholder:text-earth/45 outline-none transition-shadow focus:bg-[#EAEAEC] focus:shadow-[inset_0_0_0_2px_rgba(0,122,255,0.35)]";

  return (
    <div className="min-h-[100svh] bg-[#F2F2F7] text-ink flex flex-col antialiased selection:bg-black/10">
      <div
        className="flex flex-1 flex-col px-4 sm:px-5"
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

        <div className="mx-auto w-full max-w-[400px] flex-1 flex flex-col">
          <div className="flex flex-col items-center pt-4 pb-8 text-center">
            <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
              <span
                className="h-[64px] w-[64px] rounded-[18px] bg-gradient-to-br from-amber-200 to-amber-500 text-amber-950 flex items-center justify-center font-black text-3xl"
                aria-hidden
                style={{ fontFamily: "var(--font-display)" }}
              >
                G
              </span>
            </div>
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
              {t({ mn: "Нэвтрэх", en: "Sign In" })}
            </h1>
            <p className="mt-2 max-w-[19rem] text-[15px] leading-relaxed text-earth">
              {t({
                mn: "Гэвабалд нэвтэрч үйлчилгээ захиалж, багш нартай холбогдоно уу.",
                en: "Sign in to book sessions and message your guides.",
              })}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!showOtpInput ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-earth pl-0.5">
                      {t({ mn: "Имэйл эсвэл утас", en: "Email or Phone Number" })}
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t({ mn: "example@mail.com", en: "name@example.com" })}
                      className={fieldClass}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-earth pl-0.5">
                      {t({ mn: "Нууц үг", en: "Password" })}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t({ mn: "Нууц үг", en: "Password" })}
                        className={`${fieldClass} pr-12`}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-earth/55 transition-colors hover:bg-black/[0.06] hover:text-ink"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <Link
                      href={`/${language}/forgot-password`}
                      className="inline-block text-[15px] font-normal text-[#007AFF] active:opacity-60"
                    >
                      {t({ mn: "Нууц үгээ мартсан уу?", en: "Forgot password?" })}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-earth pl-0.5">
                    {t({ mn: "Баталгаажуулах код", en: "Verification Code" })}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    className={`${fieldClass} min-h-[56px] text-center text-[22px] font-medium tracking-[0.35em]`}
                    required
                  />
                  <p className="pt-1 text-center text-[13px] text-earth leading-snug">
                    {t({ mn: "Таны утас руу код илгээгдлээ.", en: "A code was sent to your phone." })}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-[#FFEBEA] px-4 py-3 text-[14px] text-[#C62828]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#1D1D1F] text-[17px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-45"
              >
                {loading ? (
                  <Loader2 size={22} className="animate-spin opacity-90" strokeWidth={2} />
                ) : showOtpInput ? (
                  t({ mn: "Үргэлжлүүлэх", en: "Continue" })
                ) : (
                  t({ mn: "Нэвтрэх", en: "Sign In" })
                )}
              </button>
            </form>

            <div className="pt-4 text-center">
              <Link
                href={`/${language}/privacy`}
                className="text-[13px] text-earth underline underline-offset-4 hover:text-ink active:opacity-70"
              >
                {t({ mn: "Нууцлалын бодлого", en: "Privacy Policy" })}
              </Link>
              <span className="mx-2 text-earth/40">·</span>
              <Link
                href={`/${language}/terms`}
                className="text-[13px] text-earth underline underline-offset-4 hover:text-ink active:opacity-70"
              >
                {t({ mn: "Үйлчилгээний нөхцөл", en: "Terms of Service" })}
              </Link>
            </div>

            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/[0.08]" />
              <span className="text-[12px] font-medium text-earth tabular-nums">
                {t({ mn: "эсвэл", en: "or" })}
              </span>
              <div className="h-px flex-1 bg-black/[0.08]" />
            </div>

            <p className="text-center text-[15px] text-earth leading-snug">
              {t({ mn: "Шинэ хэрэглэгч үү?", en: "New to Gevabal?" })}{" "}
              <Link
                href={`/${language}/sign-up`}
                className="font-semibold text-[#007AFF] active:opacity-60"
              >
                {t({ mn: "Бүртгүүлэх", en: "Create Account" })}
              </Link>
            </p>
          </div>

          <p className="mt-auto pt-10 text-center text-[12px] text-earth/70">
            {t({ mn: "Үргэлжлүүлснээр та манай нөхцөлийг зөвшөөрнө.", en: "By continuing you agree to our Terms." })}{" "}
            <Link href={`/${language}/terms`} className="text-[#007AFF] active:opacity-60">
              {t({ mn: "Нөхцөл", en: "Terms" })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-[#F2F2F7]">
          <Loader2 className="h-9 w-9 animate-spin text-earth/50" aria-hidden strokeWidth={1.75} />
        </div>
      }
    >
      <SignInPageInner />
    </Suspense>
  );
}
