"use client";

import React, { useState, useEffect } from "react";

type Props = {
  title: string;
  highlight?: string;
  subtitle?: string;
  right?: React.ReactNode;
  bgImage?: string;
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
  return (
    <div className="relative bg-transparent">
      {bgImage ? (
        <div className="absolute inset-0 overflow-hidden">
          <img src={bgImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
        </div>
      ) : null}

      <div
        style={{
          padding: omitNavGutter ? "8px 16px 0" : "calc(var(--nav-h) + 8px) 16px 0",
          position: "relative"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="t-large-title" style={{ color: "var(--ink)" }}>
              {title}
              {highlight ? (
                <span style={{ color: "var(--gold)" }}> {highlight}</span>
              ) : null}
            </h1>
            {subtitle ? (
              <p style={{ fontSize: "16px", fontWeight: 400, color: "var(--ink-3)", marginTop: "4px" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {right ? (
            <div style={{ flexShrink: 0, marginLeft: "16px" }}>
              {right}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
