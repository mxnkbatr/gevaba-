"use client";

import React, { useState } from "react";
import { Video, Loader2, PhoneOff, Sparkles } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { hapticsLight, hapticsMedium } from "@/app/capacitor/plugins/haptics";
import LiveRitualRoom from "@/app/components/LiveRitualRoom";
import { motion } from "framer-motion";

interface Props {
  bookingId: string;
  monkName: string;
  callStatus: "idle" | "waiting" | "in_call" | "ended";
  isMonk?: boolean;
}

export default function CallLauncher({ bookingId, monkName, callStatus, isMonk }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const { t } = useLanguage();

  const startCall = async () => {
    setIsConnecting(true);
    try {
      await hapticsMedium();

      // 1. Notify backend to start (only client starts call)
      if (!isMonk) {
        const startRes = await fetch(`/api/bookings/${bookingId}/call`, { method: "POST" });
        if (!startRes.ok) throw new Error("Could not start call");
      }

      // 2. Fetch LiveKit token
      const res = await fetch(
        `/api/livekit?room=booking-${bookingId}&username=${encodeURIComponent(isMonk ? "Monk" : "User")}`
      );
      if (!res.ok) throw new Error("Failed to get call token");

      const { token, wsUrl: url } = await res.json();
      setLiveKitToken(token);
      setWsUrl(url);
    } catch (e) {
      console.error("Call launch error:", e);
      alert(t({ mn: "Дуудлага холбоход алдаа гарлаа.", en: "Failed to connect to call." }));
      setIsConnecting(false);
    }
  };

  const endCall = async () => {
    try {
      await hapticsLight();
      await fetch(`/api/bookings/${bookingId}/call`, { method: "DELETE" });
      setLiveKitToken(null);
      setWsUrl(null);
      setIsConnecting(false);
      window.location.reload();
    } catch (e) {
      console.error("Call end error:", e);
    }
  };

  // ── Active room view ──
  if (liveKitToken && wsUrl) {
    return (
      <LiveRitualRoom
        token={liveKitToken}
        serverUrl={wsUrl}
        roomName={`booking-${bookingId}`}
        onLeave={endCall}
        isMonk={isMonk}
        bookingId={bookingId}
        monkName={monkName}
      />
    );
  }

  // ── Pre-call states ──
  return (
    <div className="mt-4">
      {/* ── CLIENT: waiting → start button ── */}
      {callStatus === "waiting" && !isMonk && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startCall}
          disabled={isConnecting}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 18,
            border: "none",
            background: isConnecting
              ? "rgba(48,209,88,0.35)"
              : "linear-gradient(135deg, #30D158 0%, #27B348 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: isConnecting
              ? "none"
              : "0 4px 24px rgba(48,209,88,0.35)",
            cursor: isConnecting ? "not-allowed" : "pointer",
            opacity: isConnecting ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {isConnecting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {t({ mn: "Холбогдож байна...", en: "Connecting..." })}
            </>
          ) : (
            <>
              <Video size={20} />
              {t({ mn: "Дуудлага эхлүүлэх", en: "Start Video Call" })}
            </>
          )}
        </motion.button>
      )}

      {/* ── MONK: waiting to be joined ── */}
      {callStatus === "waiting" && isMonk && (
        <div
          style={{
            padding: "20px 20px",
            background: "rgba(191,164,106,0.08)",
            border: "0.5px solid rgba(191,164,106,0.25)",
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <Sparkles size={20} color="var(--gold)" style={{ margin: "0 auto 10px" }} />
          <p
            style={{
              color: "var(--ink-2)",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            {t({
              mn: "Хэрэглэгч дуудлага эхлүүлэхийг хүлээж байна...",
              en: "Waiting for client to start the session...",
            })}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startCall}
            style={{
              padding: "12px 28px",
              borderRadius: 14,
              border: "none",
              background: "var(--gold)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--depth-gold)",
            }}
          >
            {t({ mn: "Засалд нэвтрэх", en: "Enter Room" })}
          </motion.button>
        </div>
      )}

      {/* ── IN_CALL: join active room ── */}
      {callStatus === "in_call" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startCall}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 18,
            border: "none",
            background: "linear-gradient(135deg, var(--sys-blue) 0%, #0055D4 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,122,255,0.35)",
          }}
        >
          <Video size={20} />
          {t({ mn: "Дуудлага руу орох", en: "Rejoin Call" })}
        </motion.button>
      )}

      {/* ── ENDED ── */}
      {callStatus === "ended" && (
        <div
          style={{
            padding: "24px 20px",
            background: "rgba(52,199,89,0.08)",
            border: "0.5px solid rgba(52,199,89,0.22)",
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(52,199,89,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <PhoneOff size={22} color="#34C759" />
          </div>
          <p style={{ color: "#34C759", fontSize: 15, fontWeight: 700 }}>
            {t({ mn: "Засал амжилттай дууслаа ✓", en: "Ritual successfully completed ✓" })}
          </p>
        </div>
      )}
    </div>
  );
}
