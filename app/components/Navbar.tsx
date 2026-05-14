"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  MessageSquare,
  User,
  Bell,
  Newspaper,
  Search,
  ShoppingBag,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCart } from "@/contexts/CartContext";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { LocalizedLink } from "./LocalizedLink";
import NotificationDropdown from "./NotificationDropdown";

const CONTENT = {
  logo: { mn: "Гэвабал", en: "Gevabal" },
  login: { mn: "Нэвтрэх", en: "Sign In" },
  profile: { mn: "Профайл", en: "Profile" },
};

export default function NativeNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { language: lang } = useLanguage();
  const { user } = useAuth();
  const { isNative, safeArea } = usePlatform();
  const { unreadCount } = useNotifications();
  const { totalItems } = useCart();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setIsScrolled(window.scrollY > 8);
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
        className="relative shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden"
        style={{ width: "36px", height: "36px", boxShadow: "var(--depth-1)", padding: "2px" }}
      >
        <Image
          src="/logo.png"
          alt="Gevabal"
          fill
          sizes="36px"
          className="object-contain"
          priority
        />
      </div>
      <span
        className="font-semibold leading-none tracking-tight text-ink"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: isScrolled ? "16px" : "17px",
          transition: "font-size 0.2s var(--ease-out)"
        }}
      >
        {CONTENT.logo[lang]}
      </span>
    </div>
  );

  const desktopNav = [
    { name: { mn: "Нүүр", en: "Home" }, href: "/" },
    { name: { mn: "Лам нар", en: "Monks" }, href: "/monks" },
    { name: { mn: "Дэлгүүр", en: "Shop" }, href: "/shop" },
    { name: { mn: "Блог", en: "Blog" }, href: "/blog" },
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
      id: "shop",
      icon: ShoppingBag,
      href: "/shop",
      label: { mn: "Дэлгүүр", en: "Shop" },
    },
    {
      id: "profile",
      icon: User,
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
              return (
                <LocalizedLink
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-5 py-2 text-[13px] font-semibold tracking-tight transition-all
                    ${isActive
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
            >
              <Search size={20} strokeWidth={1.25} />
            </LocalizedLink>
            <LocalizedLink
              href="/shop"
              className="relative rounded-full p-2 text-neutral-600 hover:bg-black/[0.04] hover:text-ink transition-colors"
            >
              <ShoppingBag size={20} strokeWidth={1.25} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white leading-none shadow-sm">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
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

      {/* ── MOBILE TOP HEADER (Apple HIG) ── */}
      {!isAuthPage && !isMessengerPage && (
        <header
          className="md:hidden mobile-header"
          style={{
            backgroundColor: isScrolled ? "rgba(242,242,247,0.94)" : "transparent",
            backdropFilter: isScrolled ? "saturate(200%) blur(28px)" : "none",
            WebkitBackdropFilter: isScrolled ? "saturate(200%) blur(28px)" : "none",
            borderBottom: isScrolled ? "0.5px solid rgba(60,60,67,0.12)" : "0.5px solid transparent",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingBottom: "8px",
            paddingTop: "env(safe-area-inset-top, 44px)",
          }}
        >
          <div className="flex items-center justify-between h-[44px]">
            <LocalizedLink
              href="/"
              aria-label="Home"
              className="active:opacity-70 transition-opacity min-w-0 shrink"
              onClick={() => { if (isNative) hapticsLight() }}
            >
              <Logo />
            </LocalizedLink>

            <div className="flex items-center gap-2 shrink-0">
              <LocalizedLink
                href="/shop"
                className="btn-icon relative"
                style={{ width: "36px", height: "36px" }}
                onClick={() => { if (isNative) hapticsLight() }}
              >
                <ShoppingBag
                  size={18}
                  strokeWidth={1.5}
                  color="var(--ink)"
                />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-sys-red flex items-center justify-center text-[9px] font-bold text-white leading-none shadow-sm border border-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </LocalizedLink>

              <div className="relative">
                <button
                  type="button"
                  className="btn-icon relative"
                  style={{ width: "36px", height: "36px" }}
                  onClick={() => {
                    if (isNative) hapticsLight();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <Bell
                    size={18}
                    strokeWidth={1.5}
                    color="var(--ink)"
                  />
                  {mounted && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-sys-red border border-white flex items-center justify-center text-[9px] font-bold text-white leading-none shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                />
              </div>

              {mounted && user && (
                <div className="flex items-center justify-center shrink-0" style={{ width: "36px", height: "36px" }}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── MOBILE BOTTOM TAB BAR (Apple HIG) ── */}
      {!isAuthPage && (
        <nav
          className="md:hidden mobile-tab-bar"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: "calc(49px + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            backgroundColor: "rgba(248,248,250,0.90)",
            backdropFilter: "saturate(200%) blur(30px)",
            WebkitBackdropFilter: "saturate(200%) blur(30px)",
            borderTop: "0.5px solid rgba(60,60,67,0.16)",
            boxShadow: "0 -1px 0 rgba(60,60,67,0.10)",
            display: "flex",
            justifyContent: "space-around"
          }}
          aria-label={lang === "mn" ? "Үндсэн цэс" : "Main navigation"}
        >
          {mobileNav.map((item) => {
            const isActive = getIsActive(item.href);

            const handleTap = async () => {
              if (isNative) {
                await hapticsLight();
              }
            };

            return (
              <LocalizedLink
                key={item.id}
                href={item.href}
                onClick={handleTap}
                className="flex flex-col items-center justify-center min-w-[60px] py-[6px] px-[8px]"
                style={{ gap: "3px" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "56px",
                    height: "32px",
                    borderRadius: "16px",
                    backgroundColor: isActive ? "var(--nav-active-bg)" : "transparent",
                    transition: "all 0.25s var(--spring)"
                  }}
                >
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 2}
                    style={{
                      color: isActive ? "var(--gold)" : "var(--ink-2)",
                      fill: "none"
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "0.01em",
                    color: isActive ? "var(--gold)" : "var(--ink-2)",
                    transition: "color 0.25s var(--spring)"
                  }}
                >
                  {item.label[lang]}
                </span>
              </LocalizedLink>
            );
          })}
        </nav>
      )}
    </>
  );
}
