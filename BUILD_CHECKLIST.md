# Build Asset Checklist — Gevabal (`mn.gevabal.buddha`)

This repo is currently **missing the actual icon/splash image files** needed for App Store / Play Store submission. The config files exist, but the PNGs referenced by Xcode/Android are not present.

## 1) Current icon status (what exists vs missing)

### Android (`android/app/src/main/res/`)
- **`mipmap-*` launcher icons**: ❌ **missing** (no `mipmap-*` folders found)
- **Adaptive icon assets**:
  - `drawable/ic_launcher_background.xml`: ✅ exists
  - `ic_launcher_foreground.png`: ❌ missing
- **Splash images**: ❌ missing (no `drawable*/splash*` PNGs found)
- **Splash background color**:
  - `@color/splashscreen_background`: ⚠️ currently `#FFFFFF` (should be `#F9F8F7` to match Capacitor config)

### iOS (`ios/App/App/Assets.xcassets/`)
- **`AppIcon.appiconset/Contents.json`**: ✅ exists
- **AppIcon PNG files referenced by `Contents.json`**: ❌ missing (no `.png` files present in the appiconset folder)
- **`Splash.imageset/Contents.json`**: ✅ exists
- **Splash PNG files referenced by `Splash.imageset/Contents.json`**: ❌ missing (no `.png` files present in the splash imageset folder)

## 2) Android icon requirements (verify these exist)

Expected files:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48×48) — ❌ missing
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72×72) — ❌ missing
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96×96) — ❌ missing
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144×144) — ❌ missing
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192×192) — ❌ missing
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` (192×192) — ❌ missing

Adaptive icon (Android 8+):
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — ❌ missing
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` — ❌ missing
- `android/app/src/main/res/drawable/ic_launcher_foreground.png` — ❌ missing
- `android/app/src/main/res/drawable/ic_launcher_background.xml` — ✅ exists (XML)

Play Store High‑Res Icon (upload in Play Console, not in APK/AAB):
- `512×512` PNG — ❗ Prepare and upload during Play Store listing (note this in `android/PlayStoreMetadata.md`)

## 3) iOS icon requirements (Contents.json entries)

`ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` includes the **required entries**:
- **1024×1024** (`ios-marketing`): ✅ present as `AppIcon-512@2x.png` entry
- **60×60 @2x, @3x (iPhone)**: ✅ present
- **76×76 @1x, @2x (iPad)**: ✅ present
- **83.5×83.5 @2x (iPad Pro)**: ✅ present

But the **actual PNG files** are missing: ❌

Important App Store rule:
- The **1024×1024** icon must be **PNG**, **no transparency/alpha**, **no rounded corners baked in**.

## 4) Splash screen requirements

### Android (`android/app/src/main/res/`)
Expected (any one approach is acceptable, but you need a valid splash implementation):
- `drawable/splash.png` or density-specific variants:
  - `drawable-ldpi/splash.png`
  - `drawable-mdpi/splash.png`
  - `drawable-hdpi/splash.png`
  - `drawable-xhdpi/splash.png`
  - `drawable-xxhdpi/splash.png`
  - `drawable-xxxhdpi/splash.png`

Status: ❌ missing

Background color requirement:
- Must match **#F9F8F7** (your Capacitor config uses `#F9F8F7`).

### iOS
`Splash.imageset/Contents.json` is present ✅, but the referenced PNGs are missing ❌.

## 5) iOS `Contents.json` fixes

No changes needed: `AppIcon.appiconset/Contents.json` already contains all required size entries and correct idioms (`iphone`, `ipad`, `ios-marketing`).

## 6) How to generate missing assets

### Option A) Generate with Capacitor assets (recommended)
1. Put a **source icon** at:
   - `resources/icon.png` (at least **1024×1024**, square, no alpha preferred)
2. Put a **source splash** at:
   - `resources/splash.png` (recommended large square, e.g. **2732×2732**)
3. Run:

```bash
npx capacitor-assets generate
```

4. Then:

```bash
npx cap sync
```

This should create:
- Android `mipmap-*` launcher icons + adaptive icon XML/PNGs
- iOS `AppIcon.appiconset` PNGs and `Splash.imageset` PNGs

### Option B) Manual export (Figma/Sketch)
- **iOS**: export a full AppIcon set (including 1024×1024 marketing icon) into `AppIcon.appiconset/` matching `Contents.json` filenames.
- **Android**: export launcher icons for each density, plus adaptive icon layers:
  - foreground: transparent PNG
  - background: solid color or image
  - generate `mipmap-anydpi-v26` XMLs (Android Studio can do this automatically).

## 7) Where to upload the 1024×1024 icon (App Store Connect)
- In **App Store Connect → My Apps → (Your App) → App Information**, upload the **1024×1024** app icon via the build (Xcode asset catalog).  
  You don’t upload it separately; it’s extracted from your uploaded build.

---

### Next action recommendation
Run `npx capacitor-assets generate` (Option A). After generation, re-check:
- Android: `mipmap-*` folders exist and contain `ic_launcher*.png`
- iOS: `.png` files exist in `AppIcon.appiconset` and `Splash.imageset`

