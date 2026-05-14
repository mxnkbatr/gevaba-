"use client";

import React, { Suspense } from 'react';
import ProductDetailClient from '../[id]/ProductDetailClient';

function ShopProductContent() {
  return (
    <ProductDetailClient 
      product={null}
    />
  );
}

export default function StaticShopProductPage() {
  return (
    <Suspense fallback={
      <div className="h-[100svh] flex items-center justify-center bg-cream">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-gold" />
      </div>
    }>
      <ShopProductContent />
    </Suspense>
  );
}
