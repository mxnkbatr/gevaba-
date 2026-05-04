"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ablyRest } from "@/lib/ably";
import IncomingCallOverlay from "./IncomingCallOverlay";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function RealTimeCallHandler() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<{
    bookingId: string;
    clientName: string;
    roomName: string;
  } | null>(null);

  useEffect(() => {
    if (!user || user.role !== "monk") return;

    // We use a simplified Ably subscription for the demo
    // In a real app, you'd use a Realtime connection with a token
    const setupAbly = async () => {
      try {
        const res = await fetch("/api/ably-token");
        const tokenData = await res.json();
        
        // Note: For client-side realtime, we'd normally use the 'ably' package
        // but since we are in a browser environment with limited tools, 
        // I will simulate the subscription or assume the Ably client is global.
        // For the sake of this implementation, I'll use a polling fallback or 
        // a standard Realtime client if available.
        
        const Ably = (await import("ably")).default;
        const realtime = new Ably.Realtime({ authUrl: "/api/ably-token" });
        const channel = realtime.channels.get(`monk:${user.dbId}:calls`);

        channel.subscribe("incoming_call", (message) => {
          setIncomingCall(message.data);
        });

        return () => {
          channel.unsubscribe();
          realtime.close();
        };
      } catch (e) {
        console.error("Ably Realtime setup error:", e);
      }
    };

    setupAbly();
  }, [user]);

  const handleAnswer = (bookingId: string) => {
    setIncomingCall(null);
    router.push(`/${language}/booking/${bookingId}`);
  };

  const handleDecline = (bookingId: string) => {
    setIncomingCall(null);
    // Optionally notify client of decline via Ably/API
  };

  return (
    <IncomingCallOverlay 
      call={incomingCall} 
      onAnswer={handleAnswer} 
      onDecline={handleDecline} 
    />
  );
}
