"use client";

import React from "react";
import { hapticsLight } from "@/app/capacitor/plugins/haptics";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: React.ReactNode;
  className?: string;
};

export default function DivineButton({
  children,
  variant = "primary",
  icon,
  className = "",
  onClick,
  ...props
}: Props) {
  const { isNative } = usePlatform();

  const handleTap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isNative) {
      await hapticsLight();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = "flex items-center justify-center gap-2 h-[52px] rounded-full transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none";

  let variantClasses = "";
  if (variant === "primary") {
    variantClasses = "bg-gold text-white text-[17px] font-semibold shadow-[0_4px_14px_rgba(191,164,106,0.25)] active:shadow-sm";
  } else if (variant === "secondary") {
    variantClasses = "bg-[rgba(191,164,106,0.14)] text-[#5A4D35] text-[17px] font-semibold";
  } else if (variant === "ghost") {
    variantClasses = "bg-transparent border border-gold text-gold text-[17px] font-semibold";
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={handleTap}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
