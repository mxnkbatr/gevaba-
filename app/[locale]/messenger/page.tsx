"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { Send, ArrowLeft, Search, MessageSquare, Loader2, User, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useRealtimeMessages } from "@/app/hooks/useRealtimeMessages";
import { LocalizedLink } from "@/app/components/LocalizedLink";
import { formatBlogPostDate, formatTimeShort } from "@/app/lib/dateUtils";

interface Conversation {
  otherId: string;
  otherName: string;
  otherImage: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isMonk: boolean;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

interface MonkUser {
  _id: string;
  name: { mn: string; en: string };
  image: string;
  title: { mn: string; en: string };
  isSpecial?: boolean;
}

export default function MessengerPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monkIdFromUrl = searchParams.get("monkId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allMonks, setAllMonks] = useState<MonkUser[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  
  const { messages, setMessages, isConnected } = useRealtimeMessages(
    selectedConv?.otherId || null,
    user?._id || user?.id || null
  );

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "monks">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${language}/sign-in`);
    }
  }, [authLoading, user, router, language]);

  const fetchMessages = React.useCallback(
    async (otherId: string) => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`/api/messages/${otherId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setMessagesLoading(false);
      }
    },
    [setMessages],
  );

  // Conversations + monks list in parallel; deep-link monk loads inline
  const fetchData = React.useCallback(async () => {
    try {
      const [convRes, monkRes] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/monks"),
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data);

        if (monkIdFromUrl) {
          const existing = data.find(
            (c: Conversation) => c.otherId === monkIdFromUrl,
          );
          if (existing) {
            setSelectedConv(existing);
          } else {
            try {
              const mRes = await fetch(`/api/monks/${monkIdFromUrl}`);
              if (mRes.ok) {
                const monkData = await mRes.json();
                setSelectedConv({
                  otherId: monkIdFromUrl,
                  otherName:
                    monkData.name[language] ||
                    monkData.name.mn ||
                    monkData.name.en,
                  otherImage: monkData.image || "/default-monk.jpg",
                  lastMessage: "",
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0,
                  isMonk: true,
                });
              }
            } catch (e) {
              console.error("Failed to fetch monk info", e);
            }
          }
        }
      }

      if (monkRes.ok) {
        setAllMonks(await monkRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch messenger data", error);
    } finally {
      setLoading(false);
    }
  }, [monkIdFromUrl, language]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (selectedConv) {
      setMessages([]);
      fetchMessages(selectedConv.otherId);
    }
  }, [selectedConv, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedConv.otherId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage })
      });

      if (res.ok) {
        const sentMsg = await res.json();
        
        // Add to local state immediately (recipient gets it via Ably)
        setMessages(prev => {
          if (prev.some(m => m._id === sentMsg._id)) return prev;
          return [...prev, sentMsg];
        });
        
        setNewMessage("");
        
        setConversations(prev => {
          const exists = prev.find(c => c.otherId === selectedConv.otherId);
          if (exists) {
            return prev.map(c => 
              c.otherId === selectedConv.otherId 
                ? { ...c, lastMessage: sentMsg.text, lastMessageAt: sentMsg.createdAt } 
                : c
            );
          } else {
            return [{
              otherId: selectedConv.otherId,
              otherName: selectedConv.otherName,
              otherImage: selectedConv.otherImage,
              lastMessage: sentMsg.text,
              lastMessageAt: sentMsg.createdAt,
              unreadCount: 0,
              isMonk: true
            }, ...prev];
          }
        });
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const startChatWithMonk = (monk: MonkUser) => {
    const existingConv = conversations.find(c => c.otherId === monk._id);
    if (existingConv) {
      setSelectedConv(existingConv);
    } else {
      setSelectedConv({
        otherId: monk._id,
        otherName: monk.name[language] || monk.name.mn || monk.name.en,
        otherImage: monk.image || "/default-monk.jpg",
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isMonk: true
      });
    }
    setActiveTab("chats");
  };

  const filteredConversations = conversations.filter(c => 
    c.otherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMonks = allMonks.filter(m => 
    (m.name[language] || m.name.mn || m.name.en).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- UTILITY: GROUP MESSAGES BY DATE ---
  const groupMessagesByDate = (msgs: Message[]) => {
    const lk = language === "mn" ? "mn" : "en";
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const date = formatBlogPostDate(msg.createdAt, lk);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 rounded-full border-2 border-black/10 border-t-gold animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // --- COMPONENT: CONVERSATION LIST ---
  if (!selectedConv) return (
    <div className="relative flex min-h-[100svh] flex-col bg-cream">
      <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-cream/90 px-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl backdrop-saturate-150 sm:px-6"
        style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 44px))", paddingBottom: 16 }}>
        <div className="mb-5 flex items-center justify-between gap-4">
           <div className="min-w-0">
             <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-earth/50">
               {t({ mn: "Холбоо", en: "Connect" })}
             </p>
             <h1 className="mt-1 font-serif text-[1.65rem] font-semibold leading-tight tracking-tight text-ink">
               {t({ mn: "Мессенжер", en: "Messages" })}
             </h1>
             <p className="mt-1 text-[12px] font-medium text-earth/60">
               {conversations.length} {t({ mn: "яриа", en: "conversations" })}
             </p>
           </div>
           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm">
             <Sparkles size={22} className="text-gold" strokeWidth={1.6} />
           </div>
        </div>

        {/* Segmented Control */}
        <div className="relative flex h-11 p-1 rounded-2xl border border-black/[0.06] bg-[#F2F2F7]">
          <div
            className="absolute top-1 bottom-1 rounded-[0.65rem] bg-white shadow-sm border border-black/[0.06] transition-[left] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              width: "calc(50% - 6px)",
              left: activeTab === "chats" ? "4px" : "calc(50% + 2px)",
            }}
            aria-hidden
          />
          {(["chats", "monks"] as const).map(tab => (
            <button key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 flex-1 py-2 text-[14px] font-semibold transition-colors duration-200 ${
                activeTab === tab ? "text-ink" : "text-earth/50"
              }`}
            >
              {tab === "chats" ? t({ mn: "Яриа", en: "Chats" }) : t({ mn: "Багш нар", en: "Monks" })}
            </button>
          ))}
        </div>
      </header>

        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-32 sm:px-6">
          <div className="py-5">
            <div className="group relative">
              <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-earth/35 transition-colors group-focus-within:text-earth/55" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'chats' ? t({ mn: "Зурвас хайх...", en: "Search messages..." }) : t({ mn: "Багш хайх...", en: "Find a guide..." })}
                className="w-full rounded-[20px] border-0 bg-[#F2F2F7] py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all placeholder:text-earth/42 focus:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-[2.5rem]" />)}
            </div>
          ) : activeTab === "chats" ? (
            filteredConversations.length === 0 ? (
              <div className="anim-fade-up mx-auto max-w-md rounded-[20px] border border-black/[0.06] bg-white px-8 py-12 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] border border-black/[0.06] bg-[#F2F2F7]">
                  <MessageSquare size={36} className="text-earth/35" strokeWidth={1.4} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink">
                  {t({ mn: "Одоогоор яриа алга", en: "Inner peace awaits" })}
                </h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-[14px] leading-relaxed text-earth/60">
                  {t({ mn: "Өөрт тохирох багшийг сонгон сэтгэлийн яриаг эхлүүлээрэй.", en: "Begin a soulful dialogue with an experienced guide today." })}
                </p>
                <button 
                  onClick={() => setActiveTab('monks')}
                  type="button"
                  className="mt-8 btn-primary min-h-[48px] px-8 normal-case tracking-tight font-semibold transition-transform active:scale-[0.98]"
                >
                  {t({ mn: "Багш хайх", en: "Find a guide" })}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <button key={conv.otherId} onClick={() => setSelectedConv(conv)}
                    className="w-full flex items-center gap-5 p-4 rounded-[20px] border border-black/[0.06] bg-white text-left shadow-sm transition-all active:scale-[0.98] hover:shadow-md">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-[1.8rem] overflow-hidden border-2 border-white shadow-soft">
                        <Image src={conv.otherImage || "/default-monk.jpg"} alt={conv.otherName}
                          width={64} height={64} className="w-full h-full object-cover" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-white bg-gold px-1.5 shadow-sm">
                          <span className="text-[10px] font-black text-neutral-900">{conv.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[16px] font-black text-ink truncate">{conv.otherName}</span>
                        <span className="text-[11px] font-bold text-earth/40 shrink-0 ml-2">
                          {conv.lastMessageAt ? formatTimeShort(conv.lastMessageAt) : ""}
                        </span>
                      </div>
                      <p className="text-[14px] text-earth/60 truncate pr-6 line-clamp-1">
                        {conv.lastMessage || t({ mn: "Шинэ яриа эхлэх...", en: "Start a conversation..." })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            // MONKS TAB (Enhanced Cards)
            <div className="space-y-4 pt-2">
              {filteredMonks.map(monk => (
                <button key={monk._id}
                  onClick={() => startChatWithMonk(monk)}
                  className="w-full flex items-center gap-5 p-5 rounded-[20px] border border-black/[0.06] bg-white text-left shadow-sm transition-all active:scale-[0.98] hover:shadow-md">
                  <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-card border-2 border-stone/5">
                    <Image src={monk.image || "/default-monk.jpg"} alt={monk.name.mn || ""}
                      width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[16px] font-black text-ink">{monk.name[language as 'mn' | 'en'] || monk.name.mn}</p>
                      {monk.isSpecial && <div className="h-1.5 w-1.5 rounded-full bg-gold" />}
                    </div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-earth/50">{monk.title?.[language as 'mn' | 'en'] || monk.title?.mn}</p>
                    <div className="flex items-center gap-1.5">
                       <p className="text-[11px] font-black text-earth/30 uppercase tracking-widest">{t({ mn: "Яг одоо боломжтой", en: "Available now" })}</p>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-gold text-neutral-900 shadow-sm">
                    <Send size={17} strokeWidth={2.2} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
    </div>
  );

  // --- COMPONENT: CHAT WINDOW (Premium Redesign) ---
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-cream">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-black/[0.06] bg-cream/92 px-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl backdrop-saturate-150 sm:gap-4 sm:px-5"
        style={{ paddingTop: "calc(10px + env(safe-area-inset-top, 44px))", paddingBottom: 14 }}>
        <button type="button" onClick={() => setSelectedConv(null)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm transition-colors active:scale-95 hover:bg-black/[0.03]">
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <LocalizedLink href={`/monks/${selectedConv.otherId}`} className="flex items-center gap-4 flex-1 min-w-0 active:opacity-70 transition-opacity">
          <div className="relative">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
               <Image src={selectedConv.otherImage || "/default-monk.jpg"} alt={selectedConv.otherName}
                width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-serif text-[17px] font-semibold leading-tight text-ink">{selectedConv.otherName}</p>
            <p className="text-[11px] font-bold text-earth/50 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t({ mn: "Онлайн", en: "Guide is present" })}
            </p>
          </div>
        </LocalizedLink>
      </header>

      {/* Messages Scroll Area */}
      <div 
        className="relative z-10 flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-6 sm:px-6"
        onScroll={(e) => {
          // Could add logic for scroll-up-to-load-more here
        }}
      >
        {messagesLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className={`h-14 skeleton rounded-[2rem] max-w-[70%] ${i % 2 === 0 ? "ml-auto" : ""}`} />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-6 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[1.35rem] border border-black/[0.06] bg-[#F2F2F7]">
              <Sparkles size={30} className="text-gold/80" strokeWidth={1.4} />
            </div>
            <p className="max-w-[14rem] font-serif text-[15px] font-medium leading-relaxed text-earth/55">
              {t({ mn: "Сэтгэлийн гүнээс ярилцаарай", en: "A quiet space for honest conversation." })}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMsgs]) => (
            <div key={date} className="space-y-6">
              {/* Date Separator */}
              <div className="flex justify-center my-10">
                <span className="rounded-full border border-black/[0.06] bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-earth/50 shadow-sm">
                  {date}
                </span>
              </div>
              
              {dateMsgs.map((msg, idx) => {
                const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
                const prevMsg = dateMsgs[idx - 1];
                const nextMsg = dateMsgs[idx + 1];
                
                const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId;
                const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId;

                return (
                  <div 
                    key={msg._id} 
                    className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirstInSequence ? "mt-4" : "mt-1"} anim-fade-up`}
                  >
                    <div className={`
                      max-w-[82%] px-5 py-3.5 text-[15px] leading-[1.6] relative shadow-sm
                      ${isMine
                        ? "bubble-mine !max-w-[82%]"
                        : "border border-black/[0.06] bg-white text-ink"}
                      ${isFirstInSequence && isLastInSequence ? "rounded-[2rem]" :""}
                      ${isFirstInSequence && !isLastInSequence ? (isMine ? "rounded-[2rem] rounded-br-[0.5rem]" : "rounded-[2rem] rounded-bl-[0.5rem]") : ""}
                      ${!isFirstInSequence && !isLastInSequence ? (isMine ? "rounded-[2rem] rounded-r-[0.5rem]" : "rounded-[2rem] rounded-l-[0.5rem]") : ""}
                      ${!isFirstInSequence && isLastInSequence ? (isMine ? "rounded-[2rem] rounded-tr-[0.5rem]" : "rounded-[2rem] rounded-tl-[0.5rem]") : ""}
                    `}>
                      {msg.text}
                      {isLastInSequence && (
                        <div className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-60 ${isMine ? "text-right" : "text-left"}`}>
                          {formatTimeShort(msg.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-10" />
      </div>

      {/* PREMIUM FLOATING INPUT HUB */}
      <div 
        className="fixed left-0 right-0 px-6 z-40 transition-all duration-300"
        style={{ bottom: "calc(var(--tab-bar-height, 83px) + env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        <div 
          className="flex items-center gap-3 rounded-[2.5rem] border border-black/[0.06] bg-white/95 p-2 shadow-sm backdrop-blur-2xl anim-fade-up"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#F2F2F7] transition-transform active:scale-95">
             <User size={20} className="text-earth/45" />
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage(e as any)}
            placeholder={t({ mn: "Асуулт асуух...", en: "Seek guidance..." })}
            className="flex-1 bg-transparent py-4 px-2 text-[15.5px] text-ink placeholder:text-earth/30 outline-none"
          />
          <button
            type="submit"
            onClick={(e) => handleSendMessage(e as any)}
            disabled={sending || !newMessage.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-gold transition-all active:scale-90 disabled:opacity-25"
          >
            {sending ? <Loader2 size={22} className="animate-spin text-neutral-900" /> : <Send size={22} className="text-neutral-900" />}
          </button>
        </div>
      </div>
    </div>
  );
}
