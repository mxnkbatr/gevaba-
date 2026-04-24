"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

async function getStored(key: string): Promise<string | null> {
    if (isNative) {
        const r = await Preferences.get({ key });
        return r.value ?? null;
    }
    return localStorage.getItem(key);
}

async function setStored(key: string, value: string): Promise<void> {
    if (isNative) {
        await Preferences.set({ key, value });
        return;
    }
    localStorage.setItem(key, value);
}

interface AccessibilityContextType {
    elderMode: boolean;
    toggleElderMode: () => void;
    fontSize: 'normal' | 'large' | 'xlarge';
    setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
    highContrast: boolean;
    toggleHighContrast: () => void;
    reduceMotion: boolean;
    toggleReduceMotion: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [elderMode, setElderMode] = useState(false);
    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
    const [highContrast, setHighContrast] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    // Load preferences from device storage (Preferences on native, localStorage on web)
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const savedElderMode = (await getStored('elderMode')) === 'true';
            const savedFontSize = ((await getStored('fontSize')) || 'normal') as 'normal' | 'large' | 'xlarge';
            const savedHighContrast = (await getStored('highContrast')) === 'true';
            const savedReduceMotion = (await getStored('reduceMotion')) === 'true';

            if (cancelled) return;
            setElderMode(savedElderMode);
            setFontSize(savedFontSize);
            setHighContrast(savedHighContrast);
            setReduceMotion(savedReduceMotion);

            // Apply classes to body
            updateBodyClasses(savedElderMode, savedFontSize, savedHighContrast, savedReduceMotion);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const updateBodyClasses = (
        elder: boolean,
        size: string,
        contrast: boolean,
        motion: boolean
    ) => {
        if (typeof document === 'undefined') return;

        document.body.classList.toggle('elder-mode', elder);
        document.body.classList.toggle('font-large', size === 'large');
        document.body.classList.toggle('font-xlarge', size === 'xlarge');
        document.body.classList.toggle('high-contrast', contrast);
        document.body.classList.toggle('reduce-motion', motion);
    };

    const toggleElderMode = () => {
        const newValue = !elderMode;
        setElderMode(newValue);
        void setStored('elderMode', String(newValue));
        updateBodyClasses(newValue, fontSize, highContrast, reduceMotion);
    };

    const handleSetFontSize = (size: 'normal' | 'large' | 'xlarge') => {
        setFontSize(size);
        void setStored('fontSize', size);
        updateBodyClasses(elderMode, size, highContrast, reduceMotion);
    };

    const toggleHighContrast = () => {
        const newValue = !highContrast;
        setHighContrast(newValue);
        void setStored('highContrast', String(newValue));
        updateBodyClasses(elderMode, fontSize, newValue, reduceMotion);
    };

    const toggleReduceMotion = () => {
        const newValue = !reduceMotion;
        setReduceMotion(newValue);
        void setStored('reduceMotion', String(newValue));
        updateBodyClasses(elderMode, fontSize, highContrast, newValue);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                elderMode,
                toggleElderMode,
                fontSize,
                setFontSize: handleSetFontSize,
                highContrast,
                toggleHighContrast,
                reduceMotion,
                toggleReduceMotion,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
}
