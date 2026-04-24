"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, Clock } from "lucide-react";
import * as Ably from "ably";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

interface Message {
  _id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface ChatWindowProps {
  bookingId: string;
  currentUserId: string;
  currentUserName: string;
  onProfileClick?: (userId: string) => void;
  clientInfo?: { firstName?: string; lastName?: string; dateOfBirth?: string; zodiacYear?: string; phone?: string; email?: string };
  isMonk?: boolean;
}

export default function ChatWindow({
  bookingId,
  currentUserId,
  currentUserName,
  onProfileClick,
  clientInfo,
  isMonk = false,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ablyClientRef = useRef<Ably.Realtime | null>(null);

  // Helper: Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper: Get Initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    if (name.includes("+") || /^\d+$/.test(name.replace(/\s/g, ""))) {
      const digits = name.replace(/\D/g, "");
      return digits.slice(-2);
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Fetch initial messages + subscribe to Ably for real-time updates
  useEffect(() => {
    let isMounted = true;
    let appStateHandle: { remove: () => Promise<void> } | null = null;

    // 1. Load existing messages via HTTP
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?bookingId=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMessages(data);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();

    // 2. Connect to Ably for real-time messages
    const client = new Ably.Realtime({
      authUrl: "/api/ably-token",
      authMethod: "GET",
    });

    ablyClientRef.current = client;

    const channel = client.channels.get(`booking-chat:${bookingId}`);
    channel.subscribe("new_message", (msg: Ably.Message) => {
      if (!isMounted) return;
      const data = msg.data as Message;
      setMessages((prev) => {
        // Deduplicate by _id
        const id = data._id?.toString();
        if (id && prev.some((m) => m._id?.toString() === id)) return prev;
        return [...prev, data];
      });
    });

    if (Capacitor.isNativePlatform()) {
      // Reduce background battery/network usage: pause realtime when app is backgrounded.
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          try {
            client.connect();
          } catch {
            // ignore
          }
        } else {
          try {
            client.connection.close();
          } catch {
            // ignore
          }
        }
      }).then((h) => {
        appStateHandle = h;
      });
    }

    return () => {
      isMounted = false;
      void appStateHandle?.remove();
      channel.unsubscribe();
      client.close();
      ablyClientRef.current = null;
    };
  }, [bookingId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: messages.length <= 1 ? "auto" : "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText(""); // Instant clear for faster feel
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          senderId: currentUserId,
          senderName: currentUserName,
          text,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
      } else {
        setInputText(text); // Restore if failed
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white md:rounded-2xl shadow-xl overflow-hidden border border-stone-100 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 shadow-sm z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Booking Discussion</h3>
              <p className="text-xs text-stone-500 flex items-center gap-1">
                ID: <span className="font-mono">{bookingId.slice(0, 8)}...</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-full border border-stone-100">
            <Clock size={12} />
            <span>Live</span>
          </div>
        </div>

        {/* Client Info Section (Only for Monks) */}
        {isMonk && clientInfo && (
          <div className="px-4 pb-3 border-t border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-3 pt-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold border-2 border-amber-200">
                {clientInfo.firstName?.[0] || clientInfo.lastName?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-stone-800 text-sm truncate">
                  {clientInfo.lastName && clientInfo.firstName ? `${clientInfo.lastName} ${clientInfo.firstName}` : "Client"}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {clientInfo.dateOfBirth && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 text-stone-600">
                      📅 {clientInfo.dateOfBirth}
                    </span>
                  )}
                  {clientInfo.zodiacYear && (
                    <span className="text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-amber-700 font-bold">
                      {clientInfo.zodiacYear}
                    </span>
                  )}
                  {clientInfo.phone && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 text-stone-600 font-mono">
                      📞 {clientInfo.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent touch-pan-y"
        ref={scrollRef}
        style={{ WebkitOverflowScrolling: 'touch', transform: 'translate3d(0,0,0)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <span className="text-xs font-medium">Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
              <MessageSquare size={32} className="text-stone-300" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs opacity-70">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  onClick={() => !isMe && onProfileClick?.(msg.senderId)}
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-opacity ${isMe
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-white text-stone-600 border-stone-200 cursor-pointer hover:opacity-80"
                    }`}
                  title={!isMe ? "Click to view profile" : ""}
                >
                  {getInitials(msg.senderName)}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {!isMe && <span className="text-[10px] font-semibold text-stone-500">{msg.senderName}</span>}
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe
                      ? "bg-amber-600 text-white rounded-tr-none"
                      : "bg-white border border-stone-200 text-stone-700 rounded-tl-none"
                      }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 px-1">
                    {msg.createdAt ? formatTime(msg.createdAt) : "Just now"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-stone-100">
        <div className="flex items-end gap-2 bg-stone-50 p-2 md:p-1.5 rounded-3xl border border-stone-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-50 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-3 md:px-4 py-3 md:py-2.5 text-sm text-stone-800 placeholder-stone-400"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !inputText.trim()}
            className="p-3 md:p-2.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600 transition-colors shadow-sm flex-shrink-0 active:scale-95"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}