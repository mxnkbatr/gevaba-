'use client';
import { useRef, useState, useCallback } from 'react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const startY = useRef(0);
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const threshold = 70;

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && dy < 120) {
      setPulling(true);
      setDistance(dy);
    }
  };

  const onTouchEnd = async () => {
    if (distance >= threshold) {
      await onRefresh();
    }
    startY.current = 0;
    setPulling(false);
    setDistance(0);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative' }}
    >
      {pulling && (
        <div style={{
          position: 'absolute',
          top: Math.min(distance - 40, 30),
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: distance / threshold,
          zIndex: 10,
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          ↓
        </div>
      )}
      <div style={{
        transform: `translateY(${pulling ? Math.min(distance * 0.4, 30) : 0}px)`,
        transition: pulling ? 'none' : 'transform 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  );
}
