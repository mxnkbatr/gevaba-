"use client";

import React, { useEffect, useState } from "react";
import { Phone, PhoneOff, User } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";

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

  useEffect(() => {
    if (!call) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(call.bookingId);
          return 0;
        }
        // Vibrate for incoming call effect
        if (prev % 2 === 0) hapticsLight();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [call, onDecline]);

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between py-24 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
          <User size={64} className="text-white/50" />
        </div>
        <div className="text-center">
          <p className="text-white/60 text-lg uppercase tracking-widest mb-2">
            {t({ mn: "Дуудлага ирж байна", en: "Incoming Call" })}
          </p>
          <h2 className="text-4xl font-bold">{call.clientName}</h2>
        </div>
      </div>

      <div className="flex gap-16">
        <button
          onClick={() => onDecline(call.bookingId)}
          className="flex flex-col items-center gap-3 active:scale-90 transition"
        >
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
            <PhoneOff size={32} />
          </div>
          <span className="text-sm font-semibold text-white/70">
            {t({ mn: "Татгалзах", en: "Decline" })}
          </span >
        </button>

        <button
          onClick={() => onAnswer(call.bookingId)}
          className="flex flex-col items-center gap-3 active:scale-90 transition"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
            <Phone size={32} />
          </div>
          <span className="text-sm font-semibold text-white/70">
            {t({ mn: "Хариулах", en: "Answer" })}
          </span>
        </button>
      </div>
      
      <div className="text-white/20 text-sm font-mono">
        {timer}s
      </div>
    </div>
  );
}
