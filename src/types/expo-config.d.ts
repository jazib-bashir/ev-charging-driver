import Constants from 'expo-constants';

declare module 'expo-constants' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ExpoConfig {
    extra?: {
      apiBaseUrl?: string;
    };
  }
}

export {};
