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
