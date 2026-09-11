import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
  googleMapsApiKey?: string;
  googleMapsMapId?: string;
};

function readExtra(): ExpoExtra {
  return (Constants.expoConfig?.extra as ExpoExtra | undefined) ?? {};
}

function readApiBaseUrl(): string | undefined {
  const { apiBaseUrl: fromExtra } = readExtra();
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  const value = (fromExtra ?? fromEnv)?.trim();
  return value ? value.replace(/\/$/, '') : undefined;
}

function readGoogleMapsApiKey(): string | undefined {
  const { googleMapsApiKey: fromExtra } = readExtra();
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (fromExtra ?? fromEnv)?.trim() || undefined;
}

function readGoogleMapsMapId(): string | undefined {
  const { googleMapsMapId: fromExtra } = readExtra();
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID;

  return (fromExtra ?? fromEnv)?.trim() || undefined;
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

export function getGoogleMapsApiKey(): string | undefined {
  return readGoogleMapsApiKey();
}

export function getGoogleMapsMapId(): string | undefined {
  return readGoogleMapsMapId();
}

export const env = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  get googleMapsApiKey() {
    return getGoogleMapsApiKey();
  },
  get googleMapsMapId() {
    return getGoogleMapsMapId();
  },
};
