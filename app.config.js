const fs = require('fs');
const path = require('path');

const { expo } = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || undefined;
const googleMapsMapId = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;

/**
 * Production Android APK for Diawi: ship arm64-v8a only (Pixel 9, S24 Ultra, Tab SM-T227U).
 * Scoped via EAS_BUILD_PROFILE so development/preview keep the default multi-ABI set.
 * expo-build-properties writes reactNativeArchitectures during prebuild (CNG-safe).
 */
const isProductionEasBuild = process.env.EAS_BUILD_PROFILE === 'production';
const isEasAndroidBuild =
  process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PLATFORM === 'android';

/**
 * react-native-maps removes com.google.android.geo.API_KEY from AndroidManifest when
 * androidGoogleMapsApiKey is missing. Opening MapView + PROVIDER_GOOGLE then crashes
 * the process. Local `expo run:android` works because .env supplies the key; EAS must
 * inject the same variable at prebuild time.
 */
if (isEasAndroidBuild && !googleMapsApiKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for this EAS Android build. ' +
      'Set it in the Expo project environment (production) or via `eas env:create`, ' +
      'then rebuild. Without it, Google Maps is omitted from AndroidManifest and the map screen crashes on open.',
  );
}

if (isProductionEasBuild && !apiBaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_BASE_URL for this EAS production build. ' +
      'Set it in the Expo project production environment or via `eas env:create`, then rebuild.',
  );
}

const GOOGLE_SERVICES_DEV = './google-services.json';
const GOOGLE_SERVICES_PRODUCTION = './google-services.production.json';

function resolveGoogleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) {
    return process.env.GOOGLE_SERVICES_JSON;
  }
  if (isProductionEasBuild) {
    if (!fs.existsSync(path.join(__dirname, 'google-services.production.json'))) {
      throw new Error(
        'Missing google-services.production.json for production (Android package com.konnectev.driver). ' +
          'Download it from the konnect-evs-driver Firebase project and place it in the repo root, then rebuild.',
      );
    }
    return GOOGLE_SERVICES_PRODUCTION;
  }
  return GOOGLE_SERVICES_DEV;
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...expo,
  plugins: [
    ...(expo.plugins ?? []),
    [
      'expo-notifications',
      {
        icon: './assets/icons/notification-icon.png',
        color: '#08785E',
        defaultChannel: 'default',
      },
    ],
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow konnectEVS to use your location to find nearby chargers.',
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
    ...(isProductionEasBuild
      ? [
          [
            'expo-build-properties',
            {
              android: {
                buildArchs: ['arm64-v8a'],
              },
            },
          ],
        ]
      : []),
  ],
  ios: {
    ...expo.ios,
    infoPlist: {
      ...expo.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription:
        'Allow konnectEVS to use your location to find nearby chargers.',
    },
    config: {
      ...expo.ios?.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...expo.android,
    ...(isProductionEasBuild ? { package: 'com.konnectev.driver' } : {}),
    googleServicesFile: resolveGoogleServicesFile(),
    permissions: [
      ...(expo.android?.permissions ?? []),
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
    ],
    config: {
      ...expo.android?.config,
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  extra: {
    apiBaseUrl,
    googleMapsApiKey,
    googleMapsMapId,
    eas: {
      projectId: 'da5173ca-e7b0-475a-90d9-18ac44e0dd8e',
    },
  },
};
