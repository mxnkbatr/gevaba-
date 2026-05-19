"use client";

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Haptic feedback utilities for native touch interactions.
 * Provides tactile feedback on user interactions for a premium feel.
 * 
 * iOS: Uses Taptic Engine
 * Android: Uses vibration motor
 * Web: Silent (no effect)
 */

const isNative = Capacitor.isNativePlatform();

/**
 * Light haptic feedback for subtle interactions (e.g., hovering, selection)
 */
export async function hapticsLight(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
        console.warn('Haptics not available:', error);
    }
}

/**
 * Medium haptic feedback for standard interactions (e.g., button press, toggle)
 */
export async function hapticsMedium(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
        console.warn('Haptics not available:', error);
    }
}

/**
 * Heavy haptic feedback for important actions (e.g., delete, confirm)
 */
export async function hapticsHeavy(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
        console.warn('Haptics not available:', error);
    }
}

/**
 * Success notification haptic (iOS only, falls back to medium on Android)
 */
export async function hapticsSuccess(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
        // Fallback to medium impact
        await hapticsMedium();
    }
}

/**
 * Warning notification haptic (iOS only, falls back to medium on Android)
 */
export async function hapticsWarning(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
        // Fallback to medium impact
        await hapticsMedium();
    }
}

/**
 * Error notification haptic (iOS only, falls back to heavy on Android)
 */
export async function hapticsError(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
        // Fallback to heavy impact
        await hapticsHeavy();
    }
}

/**
 * Selection haptic for picker/slider interactions
 */
export async function hapticsSelection(): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
    } catch (error) {
        // Fallback to light impact
        await hapticsLight();
    }
}

/**
 * Vibrate for a specific duration (use sparingly, prefer haptics)
 * @param duration - Duration in milliseconds
 */
export async function vibrate(duration: number = 200): Promise<void> {
    if (!isNative) return;

    try {
        await Haptics.vibrate({ duration });
    } catch (error) {
        console.warn('Vibration not available:', error);
    }
}
// Button-уудад ашиглах жишээ:
// <button onClick={() => { hapticsLight(); doSomething(); }}>
