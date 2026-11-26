# konnectEV Driver

The konnectEV driver app: find charging stations, join queues, and track live charging sessions.
Built with Expo (SDK 57), React Native and expo-router.

## Get started

```bash
npm install
npx expo start
```

Native projects are generated on demand (`npx expo prebuild`); `android/` and `ios/` are not committed.

## Design system

- **Color:** primary emerald `#08785E`, secondary `#10B981`. Coral and lime belong to the logo only.
- **Type:** Space Grotesk for headings and display, Plus Jakarta Sans for body and UI.
- **Theme:** `src/theme` (tokens, light and dark). Read it with `useTheme()` and build styles in a `createStyles(theme)` memo.
- **UI kit:** `src/components/ui` (Button, Surface, Badge, BottomSheet, EmptyState, ...).
- **Brand and loaders:** `src/components/brand` (wordmark, weave mark, splash overlay, illustrations) and `src/components/loaders`.

## Identifiers kept for compatibility

Android package `com.gridflow.driver` (production EAS: `com.konnectev.driver`), Expo slug
`konnect-evs-driver`, URL scheme `evchargingdriver`, and the `gridflow.driver.*` SecureStore keys
are unchanged on dev/preview so existing installs, push configuration, and sessions keep working.
Production EAS Android builds use `google-services.production.json` (Firebase project
`konnect-evs-driver`); dev/preview use `google-services.json` (`ev-charging-driver`).

## Scripts

- `npm run lint` runs `expo lint`.
- `npx tsc --noEmit` type-checks the project.

## Local Android release (Play Store / internal testing)

Signed **`.aab`** builds run on your machine (no EAS cloud quota). Play package: **`com.konnectev.driver`**.

### Production vs dev

`app.config.js` uses **`EAS_BUILD_PROFILE=production`** for Play builds:

| | `EAS_BUILD_PROFILE=production` | Default local prebuild |
|---|-------------------------------|-------------------------|
| Android package | `com.konnectev.driver` | From `app.json` |
| Firebase | `google-services.production.json` | `google-services.json` |
| Upload signing | `plugins/withAndroidProductionSigning.js` | Not applied |

Set `EAS_BUILD_PROFILE=production` before **`npx expo prebuild`** when building for Play.

The signing config plugin lives at **`plugins/withAndroidProductionSigning.js`** — it must be present in the repo (commit this folder with the app).

### Environment

Use **`.env`** (gitignored; see **`.env.example`**). Required for release:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID` (optional)
- `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`

Load **all** signing vars in the same shell as `./gradlew` (`set -a` exports entries from `.env`):

```bash
set -a && source .env && set +a
export ANDROID_UPLOAD_STORE_FILE="$HOME/.android/keystores/konnectev-upload.jks"
```

`.env` must include `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, and `ANDROID_UPLOAD_KEY_PASSWORD` (see `.env.example`). Sourcing `.env` alone is not enough unless those keys are present.

Use `$HOME` on the command line so the keystore path expands correctly.

### New signed AAB (full flow)

1. Bump **`versionCode`** in `app.json` before each Play upload (duplicate codes are rejected).

```bash
cd /path/to/ev-charging-driver

set -a && source .env && set +a
export ANDROID_UPLOAD_STORE_FILE="$HOME/.android/keystores/konnectev-upload.jks"
export EAS_BUILD_PROFILE=production
export NODE_ENV=production

npx expo prebuild --platform android --clean

cd android
./gradlew bundleRelease
```

Artifact: `android/app/build/outputs/bundle/release/app-release.aab` (signed with upload keystore when env vars are set).

**JS-only changes** (existing `android/` is fine):

```bash
cd android
set -a && source ../.env && set +a
export ANDROID_UPLOAD_STORE_FILE="$HOME/.android/keystores/konnectev-upload.jks"
./gradlew bundleRelease
```

### Verify (optional)

```bash
jarsigner -verify app/build/outputs/bundle/release/app-release.aab
keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
```

Expect `jar verified` and a cert that is **not** `CN=Android Debug`. Self-signed / PKIX warnings on `.aab` are normal.

### Google Play — internal testing

1. [Play Console](https://play.google.com/console) → app **`com.konnectev.driver`**.
2. **Testing → Internal testing → Create new release**.
3. Upload `app-release.aab`, add notes, **Start rollout**.
4. **Testers** → email list → share the opt-in link.

### Release checklist

Bump `versionCode` → `source .env` → `EAS_BUILD_PROFILE=production` → export `ANDROID_UPLOAD_STORE_FILE` → prebuild if native/config changed → `./gradlew bundleRelease` → upload AAB.

### EAS cloud (optional)

```bash
npx eas-cli@latest build --platform android --profile production
```

Set production env on the Expo project. Does not use local Gradle signing.
