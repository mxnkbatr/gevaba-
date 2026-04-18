"use client";

import React, { useState, useEffect } from "react";

const ACCENT = "var(--gold)";

type Props = {
  title: string;
  highlight?: string;
  subtitle?: string;
  right?: React.ReactNode;
  bgImage?: string;
  /** Parent is already offset below fixed nav (e.g. blog sticky band) — skip extra top padding */
  omitNavGutter?: boolean;
};

export default function LargeHeader({
  title,
  highlight,
  subtitle,
  right,
  bgImage,
  omitNavGutter = false,
}: Props) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setCompact(window.scrollY > 36);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="relative bg-white">
      {bgImage ? (
        <div className="absolute inset-0 overflow-hidden">
          <img src={bgImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
        </div>
      ) : null}

      <div
        className={`relative px-5 md:px-6 transition-[padding] duration-300 ease-out ${
          omitNavGutter
            ? compact
              ? "pt-2 pb-2"
              : "pt-4 pb-4"
            : compact
              ? "pt-[calc(env(safe-area-inset-top,0px)+52px)] pb-3"
              : "pt-[calc(env(safe-area-inset-top,0px)+56px+20px)] pb-5"
        }`}
      >
        <h1
          className={`font-semibold leading-tight tracking-[-0.03em] text-ink transition-all duration-300 ease-out ${
            compact
              ? "text-[1.35rem] md:text-[1.4rem]"
              : "text-[1.75rem] md:text-[2rem]"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}{" "}
          {highlight ? (
            <span className="font-semibold" style={{ color: ACCENT }}>
              {highlight}
            </span>
          ) : null}
        </h1>
        {subtitle && !compact ? (
          <p className="mt-2 text-[15px] font-normal leading-snug tracking-tight text-[color:var(--text-light)]">
            {subtitle}
          </p>
        ) : null}
        {right ? (
          <div
            className={`absolute right-5 md:right-6 ${
              omitNavGutter ? "top-2" : "top-[calc(env(safe-area-inset-top,0px)+12px)]"
            }`}
          >
            {right}
          </div>
        ) : null}
      </div>
    </div>
  );
}
