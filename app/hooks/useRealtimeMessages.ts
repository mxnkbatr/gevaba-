"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Ably from "ably";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export function useRealtimeMessages(
  otherId: string | null,
  userId: string | null,
  initialMessages: Message[] = []
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (ablyClientRef.current) {
      ablyClientRef.current.close();
      ablyClientRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const client = new Ably.Realtime({
      authUrl: "/api/ably-token",
      authMethod: "GET",
    });

    ablyClientRef.current = client;

    client.connection.on("connected", () => setIsConnected(true));
    client.connection.on("disconnected", () => setIsConnected(false));
    client.connection.on("closed", () => setIsConnected(false));

    // Subscribe to the current user's personal channel for incoming messages
    const channel = client.channels.get(`chat:${userId}`);
    channelRef.current = channel;

    channel.subscribe("new_message", (msg: Ably.Message) => {
      const data = msg.data as Message;
      // Only add if from the currently viewed conversation partner
      if (otherId && (data.senderId === otherId || data.receiverId === otherId)) {
        setMessages((prev) => {
          // Deduplicate by _id
          if (prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    });

    let appStateHandle: { remove: () => Promise<void> } | null = null;
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
      void appStateHandle?.remove();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, otherId]);

  return { messages, setMessages, isConnected };
}
