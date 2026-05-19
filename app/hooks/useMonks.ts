'use client';

import { useState, useEffect } from 'react';
import { getItem, setItem, CACHE_KEYS } from '@/app/capacitor/storage/offlineStorage';
import { Capacitor } from '@capacitor/core';

export function useMonks() {
  const [monks, setMonks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Cache-ээс тэр даруй харуулах (Try to show cached data immediately)
      const cached = await getItem<any[]>(CACHE_KEYS.MONKS_LIST);
      if (cached) {
        setMonks(cached);
        setLoading(false);
      }

      // 2. Сүлжээнээс шинэчлэх (Fetch from network to update)
      try {
        const baseUrl = Capacitor.isNativePlatform() ? 'https://gevabal.mn' : '';
        const res = await fetch(`${baseUrl}/api/monks`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setMonks(data);
          // 10 минут cache хадгалах (Cache for 10 minutes)
          await setItem(CACHE_KEYS.MONKS_LIST, data, { ttl: 600 });
        }
      } catch (error) {
        console.error('Failed to fetch monks:', error);
        // Offline байсан ч cache-ийн өгөгдлөөр ажиллана
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { monks, loading };
}
