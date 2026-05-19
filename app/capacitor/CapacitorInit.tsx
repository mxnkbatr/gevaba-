"use client";

import { useEffect } from 'react';
import { usePlatform } from '@/app/capacitor/hooks/usePlatform';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { initPushNotifications } from './plugins/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

/**
 * CapacitorInit — Runs once at app startup on native platforms.
 * Configures:
 *   • StatusBar  — transparent overlay, light icons
 *   • NavigationBar — dark tinted for immersive feel (Android)
 *   • Keyboard   — Native resize, no layout jump
 *   • Safe-area  — CSS vars injected for layout calculations
 *   • Back button — Android back nav with exit guard
 *   • Push Notifications — registered only after user is loaded
 *   • SplashScreen — hidden after first paint
 */
export default function CapacitorInit() {
  const { isNative, isAndroid, isIOS } = usePlatform();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isNative) return;

    let isCancelled = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    const initialize = async () => {
      // ── 1. STATUS BAR ──────────────────────────────────────────────
      // Edge-to-edge: content extends under the status bar.
      // Use Light style = dark icons (app uses light background).
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Light });
        // Android: keep bar transparent; iOS respects CSS env() automatically.
        if (isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
        await StatusBar.show();
      } catch (e) {
        console.warn('[CapacitorInit] StatusBar init failed:', e);
      }

      // ── 2. ANDROID NAVIGATION BAR ──────────────────────────────────
      // Attempt to make the Android soft nav bar translucent / dark.
      // NavigationBar plugin is optional — fall back silently if absent.
      if (isAndroid) {
        try {
          // @ts-ignore — plugin may not be installed; guard with try/catch
          const { NavigationBar } = await import('@capgo/capacitor-navigation-bar').catch(() => ({ NavigationBar: null }));
          if (NavigationBar) {
            await NavigationBar.setNavigationBarColor({ color: '#CE813C', darkButtons: false });
          }
        } catch {
          // NavigationBar plugin not installed — skip gracefully
        }
      }

      // ── 3. KEYBOARD ────────────────────────────────────────────────
      // Native resize avoids the classic "viewport shrinks" jump on iOS.
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
        await Keyboard.setScroll({ isDisabled: false });
      } catch (e) {
        console.warn('[CapacitorInit] Keyboard init failed:', e);
      }

      // ── 4. SAFE-AREA CSS VARS ──────────────────────────────────────
      // Inject precise env() values for use in layout calculations.
      const injectSafeArea = () => {
        if (document.getElementById('__capacitor_safe_area__')) return;
        const style = document.createElement('style');
        style.id = '__capacitor_safe_area__';
        style.textContent = `
          :root {
            --sat: env(safe-area-inset-top, 44px);
            --sab: env(safe-area-inset-bottom, 34px);
            --sal: env(safe-area-inset-left, 0px);
            --sar: env(safe-area-inset-right, 0px);
          }
          /* Prevent elastic over-scroll bounce bleeding content behind tabs */
          body { overscroll-behavior-y: none; }
        `;
        document.head.appendChild(style);
      };
      injectSafeArea();

      // ── 5. ANDROID BACK BUTTON ─────────────────────────────────────
      handles.push(
        await App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        })
      );

      // ── 6. APP STATE — foreground hook ────────────────────────────
      handles.push(
        await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // Restore status bar style in case another plugin changed it
            StatusBar.setStyle({ style: Style.Light }).catch(() => {});
          }
        })
      );

      // ── 7. DEEP LINK / URL OPEN ───────────────────────────────────
      handles.push(
        await App.addListener('appUrlOpen', ({ url }) => {
          // Handle gevabal://... deep links — extract path and push
          try {
            const u = new URL(url);
            const path = u.pathname;
            if (path && path !== '/') router.push(path);
          } catch {
            // Not a valid URL — ignore
          }
        })
      );

      // ── 8. PUSH NOTIFICATIONS ────────────────────────────────────
      if (user?._id) {
        try {
          await initPushNotifications(user._id.toString(), router);
        } catch (err) {
          console.error('[CapacitorInit] Push Notifications init failed:', err);
        }
      }

      // ── 9. SPLASH SCREEN HIDE ─────────────────────────────────────
      // rAF ensures at least one paint before hiding — prevents blank flash.
      // Also set a hard timeout fallback in case something delays rendering.
      const hideSplash = () => {
        if (isCancelled) return;
        void SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
      };
      requestAnimationFrame(hideSplash);
      // Hard fallback: force hide after 3s regardless
      setTimeout(hideSplash, 3000);
    };

    void initialize();

    return () => {
      isCancelled = true;
      void Promise.allSettled(handles.map((h) => h.remove()));
    };
  }, [isNative, isAndroid, user, router]);

  return null;
}
