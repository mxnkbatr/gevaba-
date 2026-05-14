"use client";

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import BlogDetailClient from '@/app/components/BlogDetailClient';

function BlogPostContent() {
  const params = useParams();
  const lang = (params.locale as string) || 'mn';
  
  return (
    <BlogDetailClient 
      post={null}
      lang={lang}
    />
  );
}

export default function StaticBlogPostPage() {
  return (
    <Suspense fallback={
      <div className="h-[100svh] flex items-center justify-center bg-cream">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-gold" />
      </div>
    }>
      <BlogPostContent />
    </Suspense>
  );
}
