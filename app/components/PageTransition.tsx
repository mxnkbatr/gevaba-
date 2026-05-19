"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

/**
 * PageTransition — Native-style slide/fade transition between routes.
 *
 * Mimics iOS UINavigationController push/pop:
 *  • Forward navigation: slides in from right, fades in
 *  • The exit animation is intentionally fast (100ms) so it feels snappy
 *
 * Why this matters for native feel:
 *  Without transitions, navigating between pages flashes white (blank HTML)
 *  for ~50-150ms on WebView, which feels completely broken compared to
 *  native apps that cross-fade or slide views instantly in GPU memory.
 *
 * Usage: Wrap {children} in [locale]/layout.tsx
 */

// iOS push animation — нарийн тохиргоо
const IOS_VARIANTS = {
  initial: { opacity: 0, x: '100%' },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.36, 0.66, 0.04, 1] },
  },
  exit: {
    opacity: 0,
    x: '-30%',
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// Web-д илүү хөнгөн animation
const WEB_VARIANTS = {
  initial: { opacity: 0, x: 14 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isIOS, isAndroid } = usePlatform();
  const variants = (isIOS || isAndroid) ? IOS_VARIANTS : WEB_VARIANTS;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants as any}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: "100%",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          // GPU compositing layer
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
