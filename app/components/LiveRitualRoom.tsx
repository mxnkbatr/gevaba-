"use client";

import React from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import BookViewer from "./BookViewer";
import { X, BookOpen, Mic, MicOff, Video, VideoOff, RotateCcw, Wifi } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { hapticsHeavy, hapticsMedium } from "@/app/capacitor/plugins/haptics";

interface Props {
  token: string;
  serverUrl: string;
  roomName: string;
  onLeave: () => void;
  isMonk?: boolean;
  bookingId?: string;
  monkName?: string;
}

/** Formats seconds as M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Top HUD bar — safe-area aware */
function RoomHUD({
  roomName,
  timeLeft,
  isMonk,
  isBookOpen,
  onToggleBook,
  onLeave,
}: {
  roomName: string;
  timeLeft: number;
  isMonk: boolean;
  isBookOpen: boolean;
  onToggleBook: () => void;
  onLeave: () => void;
}) {
  const timerColor =
    timeLeft < 60
      ? "#FF3B30"
      : timeLeft < 300
      ? "#FF9500"
      : "rgba(255,255,255,0.85)";

  const isUrgent = timeLeft < 60;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 44px) + 10px)",
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
        paddingRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
        paddingBottom: "60px",
        background:
          "linear-gradient(to bottom, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.60) 60%, transparent 100%)",
        pointerEvents: "none",
      }}
    >
      {/* Left: Room info */}
      <div className="flex flex-col gap-1" style={{ pointerEvents: "auto" }}>
        <div className="flex items-center gap-2">
          {/* Live dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#30D158",
              boxShadow: "0 0 8px #30D158",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            LIVE SESSION
          </span>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.2,
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {roomName}
        </p>
      </div>

      {/* Right: Timer + controls */}
      <div
        className="flex items-center gap-2"
        style={{ pointerEvents: "auto" }}
      >
        {/* Timer pill */}
        <motion.div
          animate={isUrgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={
            isUrgent
              ? { repeat: Infinity, duration: 0.8 }
              : { duration: 0 }
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: isUrgent
              ? "rgba(255,59,48,0.25)"
              : "rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `0.5px solid ${isUrgent ? "rgba(255,59,48,0.6)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 99,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 5,
            paddingBottom: 5,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: timerColor }}>
            {formatTime(timeLeft)}
          </span>
        </motion.div>

        {/* Book button (monk only) */}
        {isMonk && (
          <button
            onClick={onToggleBook}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isBookOpen
                ? "rgba(191,164,106,0.85)"
                : "rgba(0,0,0,0.50)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `0.5px solid ${isBookOpen ? "rgba(191,164,106,0.6)" : "rgba(255,255,255,0.14)"}`,
              cursor: "pointer",
            }}
            aria-label={isBookOpen ? "Close book" : "Open scripture"}
          >
            <BookOpen size={16} color={isBookOpen ? "#fff" : "rgba(255,255,255,0.75)"} />
          </button>
        )}

        {/* End call button */}
        <button
          onClick={onLeave}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,59,48,0.22)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "0.5px solid rgba(255,59,48,0.45)",
            cursor: "pointer",
          }}
          aria-label="End session"
        >
          <X size={16} color="#FF6B6B" />
        </button>
      </div>
    </div>
  );
}

export default function LiveRitualRoom({
  token,
  serverUrl,
  roomName,
  onLeave,
  isMonk = false,
  bookingId,
  monkName,
}: Props) {
  const [isBookOpen, setIsBookOpen] = React.useState(false);
  // 30-min session limit
  const [timeLeft, setTimeLeft] = React.useState(30 * 60);

  // ── Session timer + auto-complete ──
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (bookingId) {
            fetch(`/api/bookings/${bookingId}/complete`, { method: "POST" }).catch(
              () => {}
            );
          }
          onLeave();
          return 0;
        }
        // Pulse haptic at 5-min warning
        if (prev === 300) hapticsMedium();
        // Urgent haptic at 1-min warning
        if (prev === 60) hapticsHeavy();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onLeave, bookingId]);

  // ── Auto-leave when app goes to background (native) ──
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | null = null;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) onLeave();
    }).then((h) => {
      handle = h;
    });
    return () => {
      void handle?.remove();
    };
  }, [onLeave]);

  const handleLeave = async () => {
    await hapticsHeavy();
    onLeave();
  };

  const handleToggleBook = async () => {
    await hapticsMedium();
    setIsBookOpen((p) => !p);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: "#05051a" }}
    >
      {/* ── HUD Overlay ── */}
      <RoomHUD
        roomName={monkName ? `${monkName}` : roomName}
        timeLeft={timeLeft}
        isMonk={isMonk}
        isBookOpen={isBookOpen}
        onToggleBook={handleToggleBook}
        onLeave={handleLeave}
      />

      {/* ── LiveKit Video Area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            data-lk-theme="default"
            style={{ height: "100%", background: "#05051a" }}
            onDisconnected={onLeave}
            connect={true}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>

        {/* ── Book Sidebar / Overlay (Monk only) ── */}
        <AnimatePresence>
          {isBookOpen && (
            <BookViewer
              isOpen={isBookOpen}
              onClose={() => setIsBookOpen(false)}
              variant={isMonk ? "sidebar" : "modal"}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom safe area spacer ── */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)", background: "#05051a" }} />
    </div>
  );
}