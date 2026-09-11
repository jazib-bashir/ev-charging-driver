const { expo } = require('./app.json');

const DEFAULT_API_BASE_URL = 'https://ev-charging-backend-wwyk.onrender.com';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...expo,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  },
};
