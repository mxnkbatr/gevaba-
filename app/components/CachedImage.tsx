'use client';
import Image from 'next/image';
import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export default function CachedImage({ src, alt, width, height, priority, className }: Props) {
  const [error, setError] = useState(false);
  
  // Cloudinary URL-г оновчлох — WebP, чанарыг бууруулах
  const optimizedSrc = src?.includes('res.cloudinary.com')
    ? src.replace('/upload/', `/upload/f_webp,q_75,w_${width}/`)
    : src;

  return (
    <Image
      src={error || !src ? '/placeholder.jpg' : optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      onError={() => setError(true)}
      className={className}
      // Native WebView-д lazy loading ажиллана
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
