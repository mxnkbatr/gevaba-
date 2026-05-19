'use client';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    // Native Capacitor Network plugin (илүү найдвартай)
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/network').then(({ Network }) => {
        Network.addListener('networkStatusChange', status => {
          setIsOnline(status.connected);
        });
        Network.getStatus().then(s => setIsOnline(s.connected));
      }).catch((err) => {
        console.warn('Capacitor Network plugin not found, falling back to navigator.onLine', err);
      });
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return { isOnline };
}
