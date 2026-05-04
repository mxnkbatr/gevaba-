import React from "react";
import Image from "next/image";
import { Monk } from "@/database/types";
import { Star } from "lucide-react";

interface PremiumMonkCardProps {
  monk: Monk;
  onClick?: () => void;
}

export default function PremiumMonkCard({ monk, onClick }: PremiumMonkCardProps) {
  const isOnline = monk.isAvailable !== false;
  
  return (
    <div
      onClick={onClick}
      className="relative flex-shrink-0 cursor-pointer overflow-hidden transition-transform active:scale-[0.98]"
      style={{
        width: "200px",
        borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-md)",
        backgroundColor: "var(--stone)"
      }}
    >
      {/* Top Image Section */}
      <div className="relative w-full h-[120px] bg-secondary-bg">
        {monk.image && (
          <Image
            src={monk.image}
            alt={monk.name.en || "Monk"}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {isOnline && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-ios-live" />
            <span className="text-[10px] font-semibold text-white">Онлайн</span>
          </div>
        )}
      </div>

      {/* Bottom Info Section */}
      <div className="bg-stone p-3">
        <h3 
          className="text-ink truncate"
          style={{ fontSize: "14px", fontWeight: 600 }}
        >
          {monk.name.en || monk.name.mn}
        </h3>
        <p 
          className="text-ink-tertiary truncate mt-0.5"
          style={{ fontSize: "11px" }}
        >
          {monk.title?.en || monk.title?.mn || "Spiritual Guide"}
        </p>
        <div className="flex items-center gap-0.5 mt-1.5">
          <Star size={10} className="text-gold fill-gold" strokeWidth={0} />
          <Star size={10} className="text-gold fill-gold" strokeWidth={0} />
          <Star size={10} className="text-gold fill-gold" strokeWidth={0} />
          <Star size={10} className="text-gold fill-gold" strokeWidth={0} />
          <Star size={10} className="text-ink-quaternary fill-ink-quaternary" strokeWidth={0} />
        </div>
      </div>
    </div>
  );
}