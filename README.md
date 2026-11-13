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

Android package `com.gridflow.driver`, Expo slug `ev-charging-driver`, URL scheme `evchargingdriver`
and the `gridflow.driver.*` SecureStore keys are unchanged so existing installs, push configuration and
sessions keep working.

## Scripts

- `npm run lint` runs `expo lint`.
- `npx tsc --noEmit` type-checks the project.
