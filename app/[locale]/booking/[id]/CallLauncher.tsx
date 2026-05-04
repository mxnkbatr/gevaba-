"use client";

import React, { useState } from "react";
import { Phone, PhoneOff, Video, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import LiveRitualRoom from "@/app/components/LiveRitualRoom";

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
      hapticsLight();
      
      // 1. Notify backend (only seekers start calls)
      if (!isMonk) {
        const startRes = await fetch(`/api/bookings/${bookingId}/call`, { method: "POST" });
        if (!startRes.ok) throw new Error("Could not start call");
      }

      // 2. Get LiveKit token
      const res = await fetch(`/api/livekit?room=booking-${bookingId}&username=${encodeURIComponent(isMonk ? "Monk" : "User")}`);
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
      hapticsLight();
      await fetch(`/api/bookings/${bookingId}/call`, { method: "DELETE" });
      setLiveKitToken(null);
      setWsUrl(null);
      setIsConnecting(false);
      window.location.reload(); // Refresh to show completed state
    } catch (e) {
      console.error("Call end error:", e);
    }
  };

  if (liveKitToken && wsUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <LiveRitualRoom
          token={liveKitToken}
          serverUrl={wsUrl}
          roomName={`booking-${bookingId}`}
          onLeave={endCall}
          isMonk={isMonk}
          bookingId={bookingId}
        />
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {callStatus === "waiting" && !isMonk && (
        <button 
          onClick={startCall} 
          disabled={isConnecting}
          className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition active:scale-95 disabled:opacity-50"
        >
          {isConnecting ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <Video size={24} />
          )}
          {isConnecting ? t({ mn: "Холбогдож байна...", en: "Connecting..." }) : t({ mn: "Дуудлага эхлүүлэх", en: "Start Call" })}
        </button>
      )}

      {callStatus === "waiting" && isMonk && (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
          <p className="text-blue-700 font-semibold">
            {t({ mn: "Хэрэглэгч дуудлага эхлүүлэхийг хүлээж байна...", en: "Waiting for client to start call..." })}
          </p>
          <button 
             onClick={startCall}
             className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
          >
            {t({ mn: "Нэвтрэх", en: "Enter Room" })}
          </button>
        </div>
      )}

      {callStatus === "in_call" && (
        <button 
          onClick={startCall}
          className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 animate-pulse"
        >
          <Video size={24} />
          {t({ mn: "Дуудлага руу орох", en: "Enter Call" })}
        </button>
      )}

      {callStatus === "ended" && (
        <div className="flex flex-col items-center gap-2 text-green-600 font-bold">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <PhoneOff size={24} />
          </div>
          <span>{t({ mn: "Засал амжилттай дууслаа ✓", en: "Ritual successfully completed ✓" })}</span>
        </div>
      )}
    </div>
  );
}
