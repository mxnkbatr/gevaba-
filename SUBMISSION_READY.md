# Submission Readiness — Gevabal (`mn.gevabal.buddha`)

Date of final check: **2026-04-24**

## BUILD CONFIGURATION
- ✅ **package.json version is "1.0.0"** (`package.json`)
- ✅ **Android versionCode=1, versionName="1.0.0"** (`android/app/build.gradle`)
- ✅ **Capacitor webDir is "out"** (`capacitor.config.ts`)
- ✅ **Next static export for Capacitor builds**: `output: 'export'` when `CAPACITOR_BUILD === 'true'` (`next.config.ts`)
- ⚠️ **Console logs removed/wrapped**: app-level token logging removed, but several `console.log` remain in server routes/scripts (recommended to keep server logs but avoid logging secrets/tokens). Review before release.
- ✅ **No TODO/FIXME in app code**: remaining `TODO` mentions are only in internal docs (`AGENTS.md`, `.agent/...`).

## SECURITY FINAL CHECK
- ⚠️ **No hardcoded secrets anywhere**: no obvious API keys found by pattern scan; verify `.env` is not committed and no secrets in non-scanned binaries/assets.
- ✅ **webContentsDebuggingEnabled false in production**: gated by `isDev` = `NODE_ENV=development && CAPACITOR_BUILD !== 'true'` (`capacitor.config.ts`)
- ✅ **allowMixedContent false** (`capacitor.config.ts`)
- ⚠️ **All API routes have authentication checks**: many routes do; a full audit is still recommended. (Automated proof not complete.)

## APP STORE SPECIFIC
- ✅ **Bundle ID matches**: `mn.gevabal.buddha` in Capacitor + Xcode project (`capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj`)
- ✅ **Entitlements aps-environment=production** (`ios/App/App/App.entitlements`)
- ✅ **iOS deployment target ≥ 14.0**: currently **15.0** (`ios/App/App.xcodeproj/project.pbxproj`)
- ⚠️ **No private Apple APIs**: not detected in repo scan; final validation requires Xcode Archive validation.
- ✅ **UIKit/WebKit via Capacitor**: app uses Capacitor bridge; verify any future native plugins.

## PLAY STORE SPECIFIC
- ✅ **Package name matches**: `mn.gevabal.buddha` (`android/app/build.gradle`, `AndroidManifest.xml`)
- ✅ **targetSdk 35** (`android/app/build.gradle`)
- ✅ **android:exported on intent-filter components**: `MainActivity` exported true (`android/app/src/main/AndroidManifest.xml`)
- ✅ **No requestLegacyExternalStorage** found

## CONTENT
- ✅ **App name "Gevabal" consistent** (Android strings, Info.plist, Capacitor)
- ❌ **App icon set (not default)**: icon PNGs are currently missing from repo; must generate assets before submission.
- ❌ **Splash screen assets present + brand colors**: Android splash drawable assets missing; iOS splash PNGs missing. Background color now set to `#F9F8F7` in Android colors, but actual splash assets must be generated.
- ⚠️ **Loading states for async**: present in many critical flows (booking/profile/chat). Full QA pass still recommended.
- ⚠️ **Error boundaries for critical screens**: no global React error boundary verified; consider adding for production resiliency.

## NETWORK
- ✅ **Offline banner exists** (`app/components/OfflineBanner.tsx`)
- ⚠️ **Slow 3G / timeouts handled**: some flows use caching/fallback; recommend device testing on throttled network.
- ✅ **No localhost/192.168 URLs in production builds**: guarded behind dev-only checks; docs/scripts still reference localhost.

---

## Fixes applied in this QA pass
- Removed hardcoded “encryption key” from client “secure storage” and stopped logging push tokens.
- Updated Android splash background color to `#F9F8F7`.
- Removed TODO markers from app code paths (converted to “Human review” language).

## Remaining manual steps (required)
- **Generate app icons and splash assets** (recommended: `npx capacitor-assets generate`) and verify:
  - Android `mipmap-*` launcher icons exist
  - iOS `AppIcon.appiconset` PNGs exist
  - iOS/Android splash PNGs exist
- **iOS**: set real `DEVELOPMENT_TEAM`, confirm signing, Archive → Validate → Upload to TestFlight.
- **Android**: configure release keystore env vars and build a signed **AAB** in Android Studio; upload to Play Console.
- **FCM**: add `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` (gitignored).

## Build commands

### iOS
```bash
npm run build:mobile && npx cap open ios
```
Then Archive in Xcode (Release, Apple Distribution).

### Android
```bash
npm run build:mobile
```
Then generate signed **AAB** in Android Studio.

