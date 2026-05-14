"use client";

import React, { Suspense } from 'react';
import MonkProfileClient from '../[id]/MonkProfileClient';

/**
 * Static detail page for Capacitor compatibility.
 * This page uses query parameters (?id=...) instead of dynamic route segments
 * to avoid 404 errors on static mobile exports.
 */
function MonkDetailContent() {
  return (
    <MonkProfileClient 
      initialMonk={null}
      initialServices={[]}
      initialReviews={{ reviews: [], stats: { averageRating: 0, totalReviews: 0 } }}
    />
  );
}

export default function StaticMonkDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-[100svh] flex items-center justify-center bg-cream">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-gold" />
      </div>
    }>
      <MonkDetailContent />
    </Suspense>
  );
}
