# Android signing (Play Store)

This project’s `android/app/build.gradle` reads the **release keystore** configuration from environment variables.

## Required environment variables
- `ANDROID_KEYSTORE_PATH`: Path to your `.jks`/`.keystore` file
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEYSTORE_ALIAS`: Key alias inside the keystore
- `ANDROID_KEY_PASSWORD`: Key password (may be the same as the keystore password)

## Notes
- Never commit your keystore to git.
- `versionCode` must be incremented for every Play Store upload, even if `versionName` doesn’t change.

