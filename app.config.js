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
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
  ],
  ios: {
    ...expo.ios,
    config: {
      ...expo.ios?.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...expo.android,
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
