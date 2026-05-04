"use client";

import React, { ReactNode, useRef, useState, useCallback } from 'react';
import { usePlatform } from '@/app/capacitor/hooks/usePlatform';
import { hapticsLight } from '@/app/capacitor/plugins/haptics';

export interface MobileScrollViewProps {
    children: ReactNode;
    /** Enable pull-to-refresh */
    pullToRefresh?: boolean;
    /** Callback when pull-to-refresh is triggered */
    onRefresh?: () => Promise<void>;
    /** Custom className */
    className?: string;
    /** Scroll direction */
    direction?: 'vertical' | 'horizontal';
}

export default function MobileScrollView({
    children,
    pullToRefresh = false,
    onRefresh,
    className = '',
    direction = 'vertical',
}: MobileScrollViewProps) {
    const { isNative, isIOS } = usePlatform();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const PULL_THRESHOLD = 72; // Changed to 72px per specs

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!pullToRefresh || !onRefresh) return;

        const scrollTop = scrollRef.current?.scrollTop || 0;
        if (scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [pullToRefresh, onRefresh]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || !pullToRefresh) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;

        if (diff > 0 && diff < PULL_THRESHOLD * 1.5) {
            setPullDistance(diff);

            // Haptic feedback at threshold
            if (diff > PULL_THRESHOLD && isNative) {
                hapticsLight();
            }
        }
    }, [pullToRefresh, isNative]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || !pullToRefresh) return;

        isPulling.current = false;

        if (pullDistance > PULL_THRESHOLD && onRefresh && !isRefreshing) {
            setIsRefreshing(true);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, pullToRefresh, onRefresh, isRefreshing]);

    const refreshProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

    // Generate Apple-like activity indicator bars
    const spinnerBars = Array.from({ length: 12 }).map((_, i) => (
        <div
            key={i}
            className="absolute left-[46%] top-0 h-[28%] w-[8%] rounded-full bg-gold opacity-30"
            style={{
                transform: `rotate(${i * 30}deg) translate(0, 130%)`,
                animation: isRefreshing ? `ios-spinner 1.2s linear infinite` : 'none',
                animationDelay: `${(i * 1.2) / 12}s`,
                opacity: isRefreshing ? undefined : Math.max(0.2, refreshProgress * (i / 12)),
            }}
        />
    ));

    return (
        <div
            ref={scrollRef}
            className={`
        ${direction === 'vertical' ? 'overflow-y-auto' : 'overflow-x-auto'}
        ${direction === 'vertical' ? 'h-full' : 'w-full'}
        ${isIOS ? '-webkit-overflow-scrolling-touch' : ''}
        ${className}
        relative
      `}
            style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes ios-spinner {
                    0% { opacity: 1; }
                    100% { opacity: 0.15; }
                }
            `}} />

            {/* Pull-to-refresh indicator top-4 centered */}
            {pullToRefresh && (
                <div
                    className="absolute left-0 right-0 flex justify-center transition-opacity duration-200"
                    style={{
                        top: "16px", // top-4
                        opacity: isRefreshing || pullDistance > 10 ? 1 : 0,
                        zIndex: 10,
                        pointerEvents: 'none'
                    }}
                >
                    <div 
                        className="relative w-7 h-7"
                        style={{
                            transform: isRefreshing ? 'none' : `rotate(${refreshProgress * 360}deg) scale(${Math.min(1, 0.5 + refreshProgress * 0.5)})`,
                        }}
                    >
                        {spinnerBars}
                    </div>
                </div>
            )}

            {/* Content */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.5}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
