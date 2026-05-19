"use client";

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

export interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface PlatformInfo {
    platform: Platform;
    isNative: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isWeb: boolean;
    safeArea: SafeAreaInsets;
}

/**
 * Hook to detect the current platform and provide platform-specific values.
 * Essential for creating native-feeling UI that respects platform conventions.
 * 
 * @returns PlatformInfo object with platform detection and safe area insets
 * 
 * @example
 * ```tsx
 * const { platform, isNative, safeArea } = usePlatform();
 * 
 * return (
 *   <div style={{ paddingTop: safeArea.top }}>
 *     {isIOS ? <IOSComponent /> : <AndroidComponent />}
 *   </div>
 * );
 * ```
 */
// Synchronous initial detection — avoids a flash of wrong UI on first render.
// Capacitor.getPlatform() is safe to call outside useEffect (no DOM access).
function getInitialPlatform(): Platform {
    try { return Capacitor.getPlatform() as Platform; } catch { return 'web'; }
}

function getInitialInsets(p: Platform): SafeAreaInsets {
    return {
        top:    p === 'ios' ? 44 : p === 'android' ? 24 : 0,
        bottom: p === 'ios' ? 34 : 0,
        left: 0,
        right: 0,
    };
}

export function usePlatform(): PlatformInfo {
    const [platform, setPlatform] = useState<Platform>(getInitialPlatform);
    const [safeArea, setSafeArea] = useState<SafeAreaInsets>(() =>
        getInitialInsets(getInitialPlatform())
    );

    useEffect(() => {
        const detectedPlatform = Capacitor.getPlatform() as Platform;
        setPlatform(detectedPlatform);

        const insets = getInitialInsets(detectedPlatform);

        // Refine with actual CSS env() values if available
        if (detectedPlatform !== 'web') {
            try {
                const style = getComputedStyle(document.documentElement);
                const topSafe    = style.getPropertyValue('--sat');
                const bottomSafe = style.getPropertyValue('--sab');
                if (topSafe)    insets.top    = parseInt(topSafe)    || insets.top;
                if (bottomSafe) insets.bottom = parseInt(bottomSafe) || insets.bottom;
            } catch {
                // fallback already set
            }
        }

        setSafeArea(insets);
    }, []);

    return {
        platform,
        isNative: platform !== 'web',
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        isWeb: platform === 'web',
        safeArea,
    };
}

/**
 * Get platform-specific value
 * @param ios - Value for iOS
 * @param android - Value for Android
 * @param web - Value for web (optional, defaults to android value)
 */
export function platformSelect<T>(ios: T, android: T, web?: T): T {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return ios;
    if (platform === 'android') return android;
    return web !== undefined ? web : android;
}
