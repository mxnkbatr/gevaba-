import React from "react";
import Image from "next/image";
import { Monk } from "@/database/types";

interface PremiumMonkCardProps {
  monk: Monk;
  onClick?: () => void;
}

export default function PremiumMonkCard({ monk, onClick }: PremiumMonkCardProps) {
  // Use serif font for the monk's name and title to create a high-end feel
  // The background is solid white (Alabaster) with a very soft shadow to float
  // Subtle Morning Sky Blue border for a glassmorphism-adjacent premium accent
  return (
    <div
      onClick={onClick}
      className="relative w-full max-w-sm rounded-[24px] bg-white p-5 cursor-pointer press-effect transition-all duration-300"
      style={{
        boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
        border: "1px solid #E0F2FE",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with subtle glow */}
        <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden shadow-sm">
          <Image
            src={monk.image || "/default-blog.jpg"}
            alt={monk.name.en}
            fill
            className="object-cover"
          />
        </div>

        {/* Info Container */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Serif Typography for Name */}
          <h3 className="font-serif text-[20px] font-bold leading-tight text-[#333333]">
            {monk.name.en}
          </h3>
          <p className="font-serif text-[14px] italic text-[#8B4513] mt-1">
            {monk.title?.en || "Spiritual Guide"}
          </p>
        </div>
      </div>

      {/* Stats and Action */}
      <div className="mt-5 flex items-center justify-between border-t border-[#E0F2FE] pt-4">
        {/* Sans-serif for data */}
        <div className="flex flex-col">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-wider text-[#555555]">
            Session
          </span>
          <span className="font-sans text-[16px] font-bold text-[#333333]">
            1-on-1 Video
          </span>
        </div>

        {/* 10% Amber 'Book Now' Button with soft corners */}
        <button
          className="rounded-[24px] bg-gold px-5 py-2.5 font-sans text-[14px] font-bold text-ink shadow-sm transition-transform active:scale-95"
          style={{ boxShadow: "0 4px 14px rgba(191, 164, 106, 0.22)" }}
        >
          Book Now
        </button>
      </div>
      
      {/* Decorative Zen Iconography (Low opacity) */}
      <div className="absolute top-4 right-4 opacity-[0.03] pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      </div>
    </div>
  );
}