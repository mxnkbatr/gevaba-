import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

// IMPORTANT: webContentsDebuggingEnabled MUST be false in 
// App Store / Play Store builds. This is enforced by the 
// CAPACITOR_BUILD check below.
const isDev = process.env.NODE_ENV === 'development' && process.env.CAPACITOR_BUILD !== 'true';

const config: CapacitorConfig = {
  appId: 'mn.gevabal.buddha',
  appName: 'Gevabal',
  webDir: 'out',

  server: {
    url: isDev ? 'http://192.168.8.15:3000' : undefined,
    cleartext: isDev,
    androidScheme: 'https',
    iosScheme: 'https',
  },

  // iOS-specific optimizations
  ios: {
    contentInset: 'automatic',
    // Enable WKWebView optimizations
    webContentsDebuggingEnabled: isDev,
    limitsNavigationsToAppBoundDomains: true,
  },

  // Android-specific optimizations
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
    },
    // Enable hardware acceleration
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#F9F8F7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#BFA46A',
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DEFAULT', // Adapts to content
      backgroundColor: '#FAFAF900', // Transparent (with alpha)
      overlaysWebView: true, // Edge-to-edge: content goes under status bar
    },

    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
    },

    // Performance: Limit concurrent HTTP requests
    CapacitorHttp: {
      enabled: true,
    },

    // Preferences for caching
    Preferences: {
      group: 'mn.gevabal.buddha.preferences',
    },

    // App-specific optimizations
    App: {
      // Handle app state changes efficiently
      disableBackButtonHandler: false,
    },
  },

  // Performance optimizations
  cordova: {
    preferences: {
      ScrollEnabled: 'true',
      BackupWebStorage: 'local',
      // Disable unnecessary features
      DisallowOverscroll: 'true',
      EnableViewportScale: 'false',
      KeyboardDisplayRequiresUserAction: 'true',
      SuppressesIncrementalRendering: 'false',
      // Performance
      CordovaWebViewEngine: 'CDVWKWebViewEngine',
      WKWebViewOnly: 'true',
      // Security
      AllowInlineMediaPlayback: 'false',
    },
  },
};

export default config;
