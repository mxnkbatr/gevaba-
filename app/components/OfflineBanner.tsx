"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Global component that detects and displays an offline status banner.
 * Uses window online/offline events for real-time feedback.
 */
export default function OfflineBanner() {
    const { t } = useLanguage();
    const [isOnline, setIsOnline] = useState(true);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Initial state
        const online = navigator.onLine;
        setIsOnline(online);
        setShow(!online);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!isOnline) {
            setShow(true);
            return;
        }
        // Let the exit animation finish before unmounting.
        const id = window.setTimeout(() => setShow(false), 220);
        return () => window.clearTimeout(id);
    }, [isOnline]);

    return (
        show ? (
            <div
                className={`fixed top-0 left-0 right-0 z-[9999] overflow-hidden pointer-events-none transition-[max-height,opacity] duration-200 ease-out ${
                    isOnline ? "opacity-0 max-h-0" : "opacity-100 max-h-20"
                }`}
                style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
                aria-hidden={isOnline}
            >
                <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-2xl backdrop-blur-xl">
                    <WifiOff size={16} className="animate-pulse" />
                    <span className="text-[12px] font-black tracking-wide uppercase">
                        {t({
                            mn: "📶 Сүлжээгүй горим — Кэш ашиглаж байна",
                            en: "📶 Offline Mode — Using Cached Data",
                        })}
                    </span>
                </div>
            </div>
        ) : null
    );
}
