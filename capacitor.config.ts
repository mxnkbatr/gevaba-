import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

/**
 * IMPORTANT: webContentsDebuggingEnabled MUST be false in
 * App Store / Play Store builds. Enforced via CAPACITOR_BUILD check.
 */
const isDev =
  process.env.NODE_ENV === 'development' &&
  process.env.CAPACITOR_BUILD !== 'true';

const config: CapacitorConfig = {
  appId: 'mn.gevabal.app',
  appName: 'Gevabal',
  webDir: 'out',

  server: isDev
    ? {
        url: process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:3000',
        cleartext: true,
        androidScheme: 'https',
        iosScheme: 'https',
      }
    : undefined,

  // ── iOS ────────────────────────────────────────────────────────────
  ios: {
    // "automatic" lets iOS manage the safe area content inset natively,
    // while our CSS env() vars handle the layout offset.
    contentInset: 'automatic',
    webContentsDebuggingEnabled: isDev,
    // Restrict navigation to app-bound domains (App Store requirement).
    limitsNavigationsToAppBoundDomains: true,
    // WKWebView performance flags
    preferredContentMode: 'mobile',
    // Allow inline media (required for LiveKit video)
    allowsLinkPreview: false,
  },

  // ── Android ────────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
    // Edge-to-edge layout (required for translucent nav bar)
    useLegacyBridge: false,
  },

  plugins: {
    // ── Splash Screen ───────────────────────────────────────────────
    SplashScreen: {
      launchShowDuration: 2500,          // Show for 2.5s minimum
      launchAutoHide: true,              // Auto-hide as safety fallback
      launchFadeOutDuration: 400,
      backgroundColor: '#F9F8F7',        // Matches app bg-cream
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // ── Status Bar ──────────────────────────────────────────────────
    StatusBar: {
      style: 'LIGHT',               // Dark icons on light backgrounds
      backgroundColor: '#00000000', // Transparent — we use edge-to-edge
      overlaysWebView: true,        // Content extends under status bar
    },

    // ── Keyboard ────────────────────────────────────────────────────
    Keyboard: {
      // Native resize: iOS moves the viewport up instead of shrinking it.
      // Prevents layout reflow jump when keyboard opens.
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
    },

    // ── HTTP ────────────────────────────────────────────────────────
    // Use Capacitor's native HTTP bridge for CORS-free API calls.
    CapacitorHttp: {
      enabled: true,
    },

    // ── Preferences ─────────────────────────────────────────────────
    Preferences: {
      group: 'mn.gevabal.buddha.preferences',
    },

    // ── App ─────────────────────────────────────────────────────────
    App: {
      // We handle back button manually in CapacitorInit.tsx
      disableBackButtonHandler: false,
    },

    // ── Push Notifications ──────────────────────────────────────────
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  // ── Cordova preferences (legacy shims) ─────────────────────────────
  cordova: {
    preferences: {
      ScrollEnabled: 'true',
      BackupWebStorage: 'local',
      DisallowOverscroll: 'true',
      EnableViewportScale: 'false',
      KeyboardDisplayRequiresUserAction: 'false',  // Allow programmatic focus
      SuppressesIncrementalRendering: 'false',
      // WKWebView only (iOS 11+)
      CordovaWebViewEngine: 'CDVWKWebViewEngine',
      WKWebViewOnly: 'true',
      // Allow inline media for LiveKit video
      AllowInlineMediaPlayback: 'true',
      MediaTypesRequiringUserActionForPlayback: 'none',
    },
  },
};

export default config;
