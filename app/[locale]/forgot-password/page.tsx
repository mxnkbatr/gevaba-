"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Flower,
    ArrowRight,
    Mail,
    Lock,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ForgotPasswordPage() {
    const { t, language } = useLanguage();
    const { isLoaded, signIn, setActive } = useSignIn();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"identify" | "verify" | "success">("identify");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const content = {
        title: t({ mn: "Нууц үг сэргээх", en: "Reset Password" }),
        subtitleIdentify: t({ mn: "Бүртгэлтэй имэйл эсвэл утасны дугаараа оруулна уу.", en: "Enter your registered email or phone number." }),
        subtitleVerify: t({ mn: "Имэйл эсвэл утсаар ирсэн баталгаажуулах кодыг оруулна уу.", en: "Enter the verification code sent to your email or phone." }),
        identifierLabel: t({ mn: "Имэйл эсвэл Утас", en: "Email or Phone" }),
        codeLabel: t({ mn: "Баталгаажуулах код", en: "Verification Code" }),
        newPasswordLabel: t({ mn: "Шинэ нууц үг", en: "New Password" }),
        sendBtn: t({ mn: "Код илгээх", en: "Send Code" }),
        resetBtn: t({ mn: "Нууц үг шинэчлэх", en: "Reset Password" }),
        successTitle: t({ mn: "Амжилттай!", en: "Success!" }),
        successMsg: t({ mn: "Таны нууц үг амжилттай солигдлоо.", en: "Your password has been successfully reset." }),
        backToLogin: t({ mn: "Нэвтрэх хэсэг рүү буцах", en: "Back to Login" }),
        loadingText: t({ mn: "Түр хүлээнэ үү...", en: "Please wait..." }),
    };

    // Step 1: Send reset code to email
    const handleIdentify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError("");

        try {
            const isEmail = identifier.includes("@");
            await signIn.create({
                strategy: isEmail ? "reset_password_email_code" : "reset_password_phone_code",
                identifier: identifier,
            });
            setStep("verify");
        } catch (err: any) {
            console.error("Error identifying user:", err);
            setError(err.errors?.[0]?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code and set new password
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError("");

        try {
            const isEmail = identifier.includes("@");
            const result = await signIn.attemptFirstFactor({
                strategy: isEmail ? "reset_password_email_code" : "reset_password_phone_code",
                code,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                setStep("success");
            } else {
                setError("Unable to complete reset. Please follow the instructions in your email.");
            }
        } catch (err: any) {
            console.error("Error resetting password:", err);
            setError(err.errors?.[0]?.message || "Invalid code or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-cream font-serif overflow-hidden relative text-ink">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-muted/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 w-full flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md monastery-card p-8 sm:p-12 rounded-[2.5rem] bg-white/70 backdrop-blur-md shadow-gold"
                >
                    <div className="text-center mb-8">
                        <Link href={`/${language}`} className="inline-flex items-center gap-2 text-gold-dark hover:text-gold transition-colors mb-6 group">
                            <Flower size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span className="font-bold font-sans uppercase tracking-widest text-xs">Гэвабол</span>
                        </Link>
                        <h2 className="text-3xl font-bold text-ink mb-2">{content.title}</h2>
                        <p className="text-earth/70 text-sm font-sans leading-relaxed">
                            {step === "identify" ? content.subtitleIdentify : step === "verify" ? content.subtitleVerify : ""}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === "identify" && (
                            <motion.form
                                key="identify"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleIdentify}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="input-label text-[10px] uppercase tracking-widest text-earth/55">
                                        {content.identifierLabel}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/45">
                                            {identifier.includes("@") ? <Mail size={18} /> : <ShieldCheck size={18} />}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="input min-h-[52px] rounded-2xl pl-12 bg-white/80 border-gold/20"
                                            placeholder={t({ mn: "Имэйл эсвэл Утас", en: "Email or Phone" })}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2 px-1">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    type="submit"
                                    className="cta-button w-full min-h-[56px] shadow-gold disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>{content.loadingText}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{content.sendBtn}</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </motion.button>
                            </motion.form>
                        )}

                        {step === "verify" && (
                            <motion.form
                                key="verify"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleReset}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="input-label text-[10px] uppercase tracking-widest text-earth/55">
                                        {content.codeLabel}
                                    </label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/45" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="input min-h-[52px] rounded-2xl pl-12 bg-white/80 border-gold/20"
                                            placeholder="123456"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label text-[10px] uppercase tracking-widest text-earth/55">
                                        {content.newPasswordLabel}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/45" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input min-h-[52px] rounded-2xl pl-12 bg-white/80 border-gold/20"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2 px-1">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={loading}
                                        type="submit"
                                        className="cta-button w-full min-h-[56px] shadow-gold disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>{content.loadingText}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{content.resetBtn}</span>
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </motion.button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleIdentify}
                                            disabled={loading}
                                            className="text-xs font-bold text-gold-dark hover:text-gold hover:underline uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {t({ mn: "Код дахин илгээх", en: "Resend Code" })}
                                        </button>
                                    </div>
                                </div>
                            </motion.form>
                        )}

                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="bg-gold/15 ring-1 ring-gold/25 p-4 rounded-full">
                                        <CheckCircle2 className="text-gold-dark" size={48} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-ink mb-2">{content.successTitle}</h3>
                                <p className="text-earth/70 mb-8 font-sans">
                                    {content.successMsg}
                                </p>
                                <Link href={`/${language}/dashboard`}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="cta-button w-full min-h-[56px] shadow-gold"
                                    >
                                        {t({ mn: "Хяналтын самбар руу очих", en: "Go to Dashboard" })}
                                    </motion.button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center">
                        <Link href={`/${language}/sign-in`} className="text-sm font-bold text-gold-dark hover:text-gold hover:underline font-sans">
                            {content.backToLogin}
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
