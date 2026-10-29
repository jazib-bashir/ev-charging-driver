const { expo } = require('./app.json');

const DEFAULT_API_BASE_URL = 'https://ev-charging-backend-wwyk.onrender.com';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsMapId = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID;

/**
 * Production Android APK for Diawi: ship arm64-v8a only (Pixel 9, S24 Ultra, Tab SM-T227U).
 * Scoped via EAS_BUILD_PROFILE so development/preview keep the default multi-ABI set.
 * expo-build-properties writes reactNativeArchitectures during prebuild (CNG-safe).
 */
const isProductionEasBuild = process.env.EAS_BUILD_PROFILE === 'production';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...expo,
  plugins: [
    ...(expo.plugins ?? []),
    [
      'expo-notifications',
      {
        icon: './assets/images/gridflow-logo.png',
        color: '#f5f7f9',
        defaultChannel: 'default',
      },
    ],
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow GridFlow to use your location to find nearby chargers.',
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
        'Allow GridFlow to use your location to find nearby chargers.',
    },
    config: {
      ...expo.ios?.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...expo.android,
    googleServicesFile: './google-services.json',
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
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    googleMapsApiKey,
    googleMapsMapId,
    eas: {
      projectId: '482d6adb-bdf0-46a9-bf8c-ddacf0245e04',
    },
  },
};
