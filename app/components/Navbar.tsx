"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Users,
  MessageSquare,
  UserCircle,
  Bell,
  Newspaper,
  Search,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { LocalizedLink } from "./LocalizedLink";
import NotificationDropdown from "./NotificationDropdown";

const CONTENT = {
  logo: { mn: "Гэвабал", en: "Gevabal" },
  login: { mn: "Нэвтрэх", en: "Sign In" },
  profile: { mn: "Профайл", en: "Profile" },
};

const TAB_ACTIVE = "var(--gold)";

export default function NativeNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { language: lang } = useLanguage();
  const { user } = useAuth();
  const { isNative, safeArea } = usePlatform();
  const { unreadCount } = useNotifications();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setIsScrolled(window.scrollY > 10);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const getIsActive = (href: string) => {
    const itemPath = href === "/" ? `/${lang}` : `/${lang}${href}`;
    return (
      pathname === itemPath ||
      (href !== "/" && pathname.startsWith(itemPath))
    );
  };

  const Logo = ({ className = "" }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative shrink-0 rounded-full border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isScrolled ? "h-8 w-8 p-0.5" : "h-10 w-10 p-1"
        }`}
      >
        <Image
          src="/logo.webp"
          alt="Logo"
          width={32}
          height={32}
          className="h-full w-full object-cover rounded-full"
          priority
        />
      </div>
      <span
        className={`font-semibold leading-none tracking-tight text-ink transition-all duration-300 ${
          isScrolled ? "text-base" : "text-lg"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {CONTENT.logo[lang]}
      </span>
    </div>
  );

  const desktopNav = [
    { name: { mn: "Нүүр", en: "Home" }, href: "/" },
    { name: { mn: "Үзмэрч", en: "Exhibitor" }, href: "/monks" },
    { name: { mn: "Блог", en: "Blog" }, href: "/blog" },
    {
      name: { mn: "Мессенжер", en: "Messenger" },
      href: "/messenger",
      auth: true,
    },
  ];

  const mobileNav = [
    {
      id: "home",
      icon: Home,
      href: "/",
      label: { mn: "Нүүр", en: "Home" },
    },
    {
      id: "blog",
      icon: Newspaper,
      href: "/blog",
      label: { mn: "Блог", en: "Blog" },
    },
    {
      id: "monks",
      icon: Users,
      href: "/monks",
      label: { mn: "Лам нар", en: "Monks" },
    },
    {
      id: "messenger",
      icon: MessageSquare,
      href: "/messenger",
      label: { mn: "Мессеж", en: "Messages" },
      auth: true,
    },
    {
      id: "profile",
      icon: UserCircle,
      href: "/profile",
      label: { mn: "Профайл", en: "Profile" },
    },
  ];

  const isAuthPage = ["/sign-in", "/sign-up"].some((p) => pathname.includes(p));
  const isFocusedPage = ["/booking/", "/call/"].some((p) =>
    pathname.includes(p),
  );
  const isMessengerPage = pathname.includes("/messenger");

  if (isFocusedPage) return null;

  return (
    <>
      {/* ── DESKTOP NAVBAR ── */}
      <header className="fixed top-0 right-0 left-0 z-50 hidden justify-center border-b border-black/[0.06] bg-white/72 py-3 px-8 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl backdrop-saturate-180 md:flex">
        <nav className="w-full max-w-7xl flex items-center justify-between">
          <LocalizedLink
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Logo />
          </LocalizedLink>
          <div className="flex items-center gap-0.5 rounded-full bg-black/[0.04] p-1">
            {desktopNav.map((item) => {
              const isActive = getIsActive(item.href);
              const nextParam = encodeURIComponent(item.href);
              const targetHref =
                item.auth && !user ? `/sign-in?next=${nextParam}` : item.href;
              return (
                <LocalizedLink
                  key={item.href}
                  href={targetHref}
                  className={`relative rounded-full px-5 py-2 text-[13px] font-semibold tracking-tight transition-all
                    ${
                      isActive
                        ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06]"
                        : "text-earth hover:bg-white/80 hover:text-ink"
                    }`}
                >
                  {item.name[lang]}
                </LocalizedLink>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <LocalizedLink
              href="/monks"
              className="rounded-full p-2 text-neutral-600 hover:bg-black/[0.04] hover:text-ink transition-colors"
              aria-label={lang === "mn" ? "Хайх" : "Search"}
            >
              <Search size={20} strokeWidth={1.25} />
            </LocalizedLink>
            {mounted ? (
              user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-border">
                  <LocalizedLink
                    href="/profile"
                    className="text-xs font-semibold uppercase tracking-wide text-ink hover:opacity-70 transition-opacity"
                  >
                    {CONTENT.profile[lang]}
                  </LocalizedLink>
                  <UserButton />
                </div>
              ) : (
                <LocalizedLink href="/sign-in">
                  <button className="btn-primary text-xs py-2.5 px-6">
                    {CONTENT.login[lang]}
                  </button>
                </LocalizedLink>
              )
            ) : (
              <div className="w-24 h-10 bg-black/5 animate-pulse rounded-full" />
            )}
          </div>
        </nav>
      </header>

      {/* ── MOBILE TOP HEADER (VCM-style: white + actions) ── */}
      {!isAuthPage && !isMessengerPage && (
        <header
          className={`md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-5 py-2 transition-[background,box-shadow,border-color] duration-300 border-b border-transparent ${
            isScrolled
              ? "bg-white/65 [backdrop-filter:saturate(180%)_blur(20px)] [-webkit-backdrop-filter:saturate(180%)_blur(20px)] shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] border-black/[0.06]"
              : "bg-white/50 [backdrop-filter:saturate(160%)_blur(16px)] [-webkit-backdrop-filter:saturate(160%)_blur(16px)]"
          }`}
          style={{
            height: `calc(52px + env(safe-area-inset-top, 44px))`,
            paddingTop: isNative
              ? `${Math.max(safeArea.top, 16)}px`
              : "env(safe-area-inset-top, 44px)",
          }}
        >
          <LocalizedLink
            href="/"
            aria-label="Home"
            className="active:opacity-70 transition-opacity min-w-0 shrink"
          >
            <Logo />
          </LocalizedLink>

          <div className="flex items-center gap-0.5 shrink-0">
            <LocalizedLink
              href="/monks"
              className="rounded-full p-2.5 text-neutral-600 hover:bg-black/[0.04] hover:text-ink active:scale-95 transition-all"
              aria-label={lang === "mn" ? "Хайх" : "Search"}
            >
              <Search
                size={isScrolled ? 20 : 22}
                strokeWidth={1.25}
              />
            </LocalizedLink>
            <div className="relative">
              <button
                type="button"
                className="relative rounded-full p-2.5 text-neutral-700 hover:bg-black/[0.04] transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label={
                  lang === "mn" ? "Мэдэгдэл" : "Notifications"
                }
              >
                <Bell
                  size={isScrolled ? 24 : 26}
                  strokeWidth={1.25}
                  className="text-neutral-800"
                />
                {mounted && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white leading-none shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          </div>
        </header>
      )}

      {/* ── MOBILE BOTTOM: floating tab bar (native iOS / Capacitor feel) ── */}
      {!isAuthPage && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pointer-events-none"
          style={{
            paddingBottom: `max(10px, env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <nav
            className="pointer-events-auto isolate flex w-full max-w-[min(100%,420px)] items-center justify-between gap-0.5 rounded-[26px] border border-black/[0.08] bg-white/78 px-1.5 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] [backdrop-filter:saturate(180%)_blur(28px)] [-webkit-backdrop-filter:saturate(180%)_blur(28px)]"
            aria-label={lang === "mn" ? "Үндсэн цэс" : "Main navigation"}
          >
            {mobileNav.map((item) => {
              const isActive = getIsActive(item.href);
              const nextParam = encodeURIComponent(item.href);
              const targetHref =
                item.auth && !user ? `/sign-in?next=${nextParam}` : item.href;

              const handleTap = async () => {
                if (isNative) {
                  await hapticsLight();
                }
              };

              return (
                <LocalizedLink
                  key={item.id}
                  href={targetHref}
                  onClick={handleTap}
                  className={`relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-[18px] transition-transform duration-200 ease-out active:scale-[0.94] ${
                    isActive
                      ? "bg-black/[0.04] shadow-[inset_0_0_0_1px_rgba(60,60,67,0.10)]"
                      : "active:bg-black/[0.04]"
                  }`}
                >
                  <div className="relative flex h-8 w-10 shrink-0 items-center justify-center">
                    <item.icon
                      size={24}
                      strokeWidth={isActive ? 2 : 1.35}
                      className="transition-colors duration-200"
                      style={{
                        color: isActive
                          ? TAB_ACTIVE
                          : "rgba(60, 60, 67, 0.42)",
                      }}
                    />
                    {item.id === "messenger" &&
                      user &&
                      unreadCount > 0 && (
                        <span className="absolute right-0 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FF3B30] z-10 shadow-sm" />
                      )}
                  </div>
                  <span
                    className="mt-0.5 max-w-full truncate px-0.5 text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200"
                    style={{
                      color: isActive
                        ? TAB_ACTIVE
                        : "rgba(60, 60, 67, 0.48)",
                    }}
                  >
                    {item.label[lang]}
                  </span>
                </LocalizedLink>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
