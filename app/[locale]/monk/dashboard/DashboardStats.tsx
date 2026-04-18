"use client";

import React from "react";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface DashboardStatsProps {
  monthEarnings: number;
  weekEarnings: number;
  pendingPayments: number;
}

export default function DashboardStats({
  monthEarnings,
  weekEarnings,
  pendingPayments
}: DashboardStatsProps) {
  const { t } = useLanguage();

  const stats = [
    { 
      label: t({ mn: "Энэ сар", en: "This Month" }), 
      value: `${(monthEarnings / 1000).toFixed(0)}к₮`, 
      icon: TrendingUp, 
      color: "text-emerald-600 bg-emerald-50" 
    },
    { 
      label: t({ mn: "Энэ 7 хоног", en: "This Week" }), 
      value: `${(weekEarnings / 1000).toFixed(0)}к₮`, 
      icon: DollarSign, 
      color: "text-gold bg-amber-50" 
    },
    { 
      label: t({ mn: "Хүлээгдэж буй", en: "Pending" }), 
      value: `${(pendingPayments / 1000).toFixed(0)}к₮`, 
      icon: Clock, 
      color: "text-amber-600 bg-amber-50" 
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-3xl p-4 shadow-sm border border-stone/15">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
            <stat.icon size={18} />
          </div>
          <p className="text-[18px] font-semibold text-ink leading-none">{stat.value}</p>
          <p className="text-[10px] font-bold text-earth/50 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
