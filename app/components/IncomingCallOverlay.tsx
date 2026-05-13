"use client";

import React, { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { hapticsLight, hapticsHeavy, hapticsMedium } from "@/app/capacitor/plugins/haptics";
import { motion, AnimatePresence } from "framer-motion";

interface IncomingCall {
  bookingId: string;
  clientName: string;
  roomName: string;
}

interface Props {
  call: IncomingCall | null;
  onAnswer: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
}

export default function IncomingCallOverlay({ call, onAnswer, onDecline }: Props) {
  const { t } = useLanguage();
  const [timer, setTimer] = useState(30);
  const ringRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Haptic ring pattern ──
  useEffect(() => {
    if (!call) return;
    setTimer(30);

    let tick = 0;
    ringRef.current = setInterval(() => {
      tick++;
      // Alternating haptic pattern: heavy → light → light → pause
      if (tick % 4 === 0) hapticsHeavy();
      else if (tick % 4 === 1) hapticsLight();
    }, 500);

    return () => {
      if (ringRef.current) clearInterval(ringRef.current);
    };
  }, [call?.bookingId]);

  // ── Auto-decline countdown ──
  useEffect(() => {
    if (!call) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(call.bookingId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [call, onDecline]);

  const handleAnswer = async () => {
    if (!call) return;
    if (ringRef.current) clearInterval(ringRef.current);
    await hapticsHeavy();
    onAnswer(call.bookingId);
  };

  const handleDecline = async () => {
    if (!call) return;
    if (ringRef.current) clearInterval(ringRef.current);
    await hapticsMedium();
    onDecline(call.bookingId);
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          key="incoming-call"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center"
          style={{
            background: "linear-gradient(160deg, #0F172A 0%, #1a1035 50%, #0F172A 100%)",
          }}
        >
          {/* Subtle mandala / radial bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 38%, rgba(191,164,106,0.10) 0%, transparent 65%)",
            }}
          />

          {/* ── Top Info Area ── */}
          <div
            className="flex flex-col items-center"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 44px) + 48px)",
              flex: 1,
              justifyContent: "center",
              gap: 0,
            }}
          >
            {/* Incoming label */}
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 28,
              }}
            >
              {t({ mn: "Дуудлага ирж байна", en: "Incoming Call" })}
            </p>

            {/* Avatar with pulsing rings */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Ring 1 */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: 156,
                  height: 156,
                  borderRadius: "50%",
                  border: "1px solid rgba(191,164,106,0.5)",
                }}
              />
              {/* Ring 2 */}
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.55 }}
                style={{
                  position: "absolute",
                  width: 132,
                  height: 132,
                  borderRadius: "50%",
                  border: "1px solid rgba(191,164,106,0.4)",
                }}
              />
              {/* Avatar circle */}
              <div
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, rgba(191,164,106,0.22), rgba(191,164,106,0.08))",
                  border: "1.5px solid rgba(191,164,106,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  🧘
                </span>
              </div>
            </div>

            {/* Caller name */}
            <h2
              style={{
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-display)",
                marginBottom: 8,
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              {call.clientName}
            </h2>

            {/* Subtitle */}
            <p
              style={{
                color: "rgba(191,164,106,0.70)",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 0.2,
              }}
            >
              {t({ mn: "Засалд дуудаж байна", en: "Requesting a ritual session" })}
            </p>
          </div>

          {/* ── Action Buttons ── */}
          <div
            className="flex items-center justify-center"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 48px)",
              gap: 64,
            }}
          >
            {/* Decline */}
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={handleDecline}
              className="flex flex-col items-center gap-3"
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(255,59,48,0.20)",
                  border: "0.5px solid rgba(255,59,48,0.40)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 24px rgba(255,59,48,0.25)",
                }}
              >
                <PhoneOff size={28} color="#FF3B30" />
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {t({ mn: "Татгалзах", en: "Decline" })}
              </span>
            </motion.button>

            {/* Answer */}
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={handleAnswer}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #30D158, #27B348)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 32px rgba(48,209,88,0.45), 0 0 0 8px rgba(48,209,88,0.12)",
                }}
              >
                <Phone size={28} color="#fff" />
              </motion.div>
              <span
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {t({ mn: "Хариулах", en: "Answer" })}
              </span>
            </motion.button>
          </div>

          {/* ── Countdown indicator ── */}
          <div
            style={{
              position: "absolute",
              bottom: "calc(env(safe-area-inset-bottom, 34px) + 18px)",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.18)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {timer}s
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
