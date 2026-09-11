import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
};

function readApiBaseUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const fromExtra = extra?.apiBaseUrl;
  // Literal reference so Metro can inline it at bundle time when present.
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  const value = (fromExtra ?? fromEnv)?.trim();
  return value ? value.replace(/\/$/, '') : undefined;
}

let cachedApiBaseUrl: string | undefined;

export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const value = readApiBaseUrl();

  if (!value) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Copy .env.example to .env and set a value, then restart the Expo dev server.',
    );
  }

  cachedApiBaseUrl = value;
  return cachedApiBaseUrl;
}

export const env = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
};
