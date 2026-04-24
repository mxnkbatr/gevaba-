This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# buddha

## Mobile Production Build (Android)

To generate a production keystore for Google Play Store releases, use the following `keytool` command:

```bash
keytool -genkey -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

After generating the keystore, modify the following environment variables in your `.env` (or setup in your CI/CD workflow pipeline) to ensure a signed Play Store release bundle:
- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

## Push Notifications (FCM) setup (required for production)

This app uses **Firebase Cloud Messaging (FCM)** via Capacitor Push Notifications.

### Android
- Place your Firebase config at `android/app/google-services.json` (this file is intentionally not committed).
- Ensure `android/app/build.gradle` applies `com.google.gms.google-services` when the file exists (already handled).

### iOS
- Place your Firebase config at `ios/App/App/GoogleService-Info.plist` (intentionally not committed).
- Ensure Push Notifications capability + `aps-environment` entitlements are set for the build configuration.

### Server (Firebase Admin)
Server-side push sending uses environment variables/service account:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string) and/or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

