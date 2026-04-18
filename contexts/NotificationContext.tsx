"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import type { Notification as DBNotification, Booking } from "@/database/types";
import { fetchWithFallback } from "@/lib/fetchWithFallback";
import { CACHE_KEYS } from "@/app/capacitor/storage/offlineStorage";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationContextType {
  notifications: DBNotification[];
  unreadCount: number;
  markAsRead: (id?: string, all?: boolean) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  refreshNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const trackedBookings = useRef<Set<string>>(new Set());

  // Define how to handle incoming push notification
  const handleForegroundPush = (notificationData: any) => {
    const { title, body, data } = notificationData;
    
    // Check if we should create a local notification object to immediately show it in the dropdown
    const newNotif: DBNotification = {
      _id: `realtime-${Date.now()}`,
      userId: user?.id || "",
      title: { mn: title, en: title },
      message: { mn: body, en: body },
      type: data?.type || "system",
      read: false,
      createdAt: new Date(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
    toast(title, { icon: '🔔', duration: 5000 });
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchWithFallback<{ notifications: DBNotification[] }>(
        "/api/user/notifications",
        CACHE_KEYS.NOTIFICATIONS,
        60 // 1 minute TTL for notifications
      );
      if (data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: DBNotification) => !n.read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id?: string, all?: boolean) => {
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, all }),
      });
      if (res.ok) {
        if (all) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        } else if (id) {
          setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  // --- REMINDER LOGIC (T-5 and T-0) ---
  const checkUpcomingBookings = async () => {
    if (!user?.id) return;
    try {
      // Use fallback to avoid "Failed to fetch" on mobile network drops
      const bookings = await fetchWithFallback<Booking[]>(
        `/api/bookings?userId=${user.id}`,
        `${CACHE_KEYS.BOOKINGS}_${user.id}`,
        300 // 5 minutes TTL
      );
      
      if (!bookings || !Array.isArray(bookings)) return;
      
      const confirmed = bookings.filter(b => b.status === "confirmed");
      const now = new Date();
      
      confirmed.forEach(booking => {
        if (!booking.date || !booking.time) return;
        
        const [h, m] = booking.time.split(':').map(Number);
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(h, m, 0, 0);

        const diffSeconds = Math.floor((bookingDate.getTime() - now.getTime()) / 1000);
        const bookingIdStr = booking._id?.toString() || "";

        // T-5 Reminder (300 seconds)
        if (diffSeconds <= 300 && diffSeconds > 240 && !trackedBookings.current.has(`${bookingIdStr}-t5`)) {
          trackedBookings.current.add(`${bookingIdStr}-t5`);
          triggerReminder(booking, "t5");
        }

        // T-0 Start (0 seconds)
        if (diffSeconds <= 0 && diffSeconds > -60 && !trackedBookings.current.has(`${bookingIdStr}-t0`)) {
          trackedBookings.current.add(`${bookingIdStr}-t0`);
          triggerReminder(booking, "t0");
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Reminder check skipped due to network/cache issue:", msg);
    }
  };

  const triggerReminder = (booking: Booking, type: "t5" | "t0") => {
    const title = type === "t5" 
      ? { mn: "Уулзалт эхлэхэд 5 минут үлдлээ", en: "Appointment starts in 5 minutes" }
      : { mn: "Уулзалт эхэллээ", en: "Appointment Starting Now" };
    
    const message = type === "t5"
      ? { mn: "Таны захиалсан засал 5 минутын дараа эхэлнэ. Бэлтгэлтэй байна уу.", en: "Your session starts in 5 minutes. Please be ready." }
      : { mn: "Уулзалт эхэллээ. Өрөөнд нэвтэрч ороорой.", en: "Your session is starting now. Please enter the room." };

    // 1. Add to local notifications
    const newNotif: DBNotification = {
      _id: `temp-${Date.now()}`,
      userId: user.id,
      title,
      message,
      type: "reminder",
      read: false,
      link: "/profile",
      createdAt: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 2. Browser alert if active
    if (Notification.permission === "granted") {
      new window.Notification(title.en, { body: message.en });
    } else {
      toast(title.mn, { icon: '🔔', duration: 8000 });
    }
  };

  useEffect(() => {
    if (user) {
      const kick = () => {
        fetchNotifications();
      };
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(kick, { timeout: 2000 });
      } else {
        setTimeout(kick, 0);
      }

      let pushListener: any = null;

      // Register Capacitor PushNotifications listener for mobile
      if (Capacitor.isNativePlatform()) {
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          handleForegroundPush({
            title: notification.title || "Шинэ мэдэгдэл",
            body: notification.body || "",
            data: notification.data
          });
        }).then(listener => {
          pushListener = listener;
        }).catch(() => {
          /* non-fatal: push may be unavailable in simulator / web */
        });
      }

      // Consolidate into one 30s polling interval for both notifications and reminders
      const interval = setInterval(() => {
        fetchNotifications();
        checkUpcomingBookings();
      }, 30000);
      
      // Request notification permission after 30s delay if still default (for web)
      if (typeof window !== 'undefined' && "Notification" in window) {
        setTimeout(() => {
          if (window.Notification.permission === 'default') {
            window.Notification.requestPermission();
          }
        }, 30000);
      }

      return () => {
        clearInterval(interval);
        if (pushListener) {
          pushListener.remove();
        }
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
