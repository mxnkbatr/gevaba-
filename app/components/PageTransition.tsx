"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

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

const VARIANTS = {
  initial: {
    opacity: 0,
    // Slides in 14px from right — subtle, not dramatic
    x: 14,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    // Exits to left (slightly) — feels like page is being pushed behind
    x: -8,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          width: "100%",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
