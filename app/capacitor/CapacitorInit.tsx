"use client";

import { useEffect } from 'react';
import { usePlatform } from '@/app/capacitor/hooks/usePlatform';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { initPushNotifications } from './plugins/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Initialize Capacitor plugins and platform-specific behavior.
 * This component should be placed in the root layout.
 */
export default function CapacitorInit() {
    const { isNative } = usePlatform();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isNative) return;

        let isCancelled = false;
        const listenerHandles: Array<{ remove: () => Promise<void> }> = [];

        const initialize = async () => {
            // ... (previous status bar logic)
            try {
                await StatusBar.setOverlaysWebView({ overlay: true });
                await StatusBar.setStyle({ style: Style.Light });
                await StatusBar.setBackgroundColor({ color: '#00000000' });
            } catch (e) {
                console.warn('StatusBar initialization failed:', e);
            }

            // Push Notifications initialization
            if (user?._id) {
                try {
                    await initPushNotifications(user._id.toString(), router);
                } catch (err) {
                    console.error('Push Notifications init failed:', err);
                }
            }

            // ... (rest of initialize)
            // Handle back button on Android
            listenerHandles.push(
                await App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    App.exitApp();
                } else {
                    window.history.back();
                }
                })
            );

            // Handle app state changes (token refresh when foregrounded)
            listenerHandles.push(
                await App.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    // Foreground hook: place token refresh logic here if needed.
                }
                })
            );

            const addSafeAreaCSS = () => {
                const style = document.createElement('style');
                style.textContent = `
          :root {
            --sat: env(safe-area-inset-top, 0px);
            --sab: env(safe-area-inset-bottom, 0px);
            --sal: env(safe-area-inset-left, 0px);
            --sar: env(safe-area-inset-right, 0px);
          }
        `;
                document.head.appendChild(style);
            };

            addSafeAreaCSS();

            // Hide the native splash screen once the first UI has mounted.
            // This prevents App Store / Play Store reviewers from seeing a "stuck" splash.
            // Using rAF ensures at least one paint before hiding.
            try {
                requestAnimationFrame(() => {
                    if (isCancelled) return;
                    void SplashScreen.hide();
                });
            } catch (e) {
                console.warn('SplashScreen.hide() failed:', e);
            }
        };

        void initialize();

        // Cleanup
        return () => {
            isCancelled = true;
            void Promise.allSettled(listenerHandles.map((h) => h.remove()));
        };
    }, [isNative, user, router]);

    return null;
}
