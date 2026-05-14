"use client";

import React, { Suspense } from 'react';
import BookingPageGate from '../[id]/BookingPageGate';

function BookingDetailContent() {
  return <BookingPageGate />;
}

export default function StaticBookingDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-[100svh] flex items-center justify-center bg-cream">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-gold" />
      </div>
    }>
      <BookingDetailContent />
    </Suspense>
  );
}
