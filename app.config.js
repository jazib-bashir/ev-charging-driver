const { expo } = require('./app.json');

const DEFAULT_API_BASE_URL = 'https://ev-charging-backend-wwyk.onrender.com';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsMapId = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...expo,
  plugins: [
    ...(expo.plugins ?? []),
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
    permissions: [
      ...(expo.android?.permissions ?? []),
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
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
