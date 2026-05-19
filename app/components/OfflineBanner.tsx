'use client';
import { useNetworkStatus } from '@/app/capacitor/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

/**
 * Global component that detects and displays a premium offline status banner.
 * Uses the native Capacitor Network plugin for reliability.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 44px) + 50px)',
            left: '16px',
            right: '16px',
            background: 'rgba(255, 59, 48, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(255,59,48,0.4)',
          }}
        >
          <WifiOff size={16} />
          Интернэт холболт алга — кэшлэгдсэн мэдээлэл харуулж байна
        </motion.div>
      )}
    </AnimatePresence>
  );
}
