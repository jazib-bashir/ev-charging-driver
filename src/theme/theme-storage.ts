import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { ThemeMode } from '@/theme/colors';

const THEME_MODE_KEY = 'gridflow.driver.theme_mode';

const memoryStore = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore web storage failures
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (memoryStore.has(key)) {
      return memoryStore.get(key) ?? null;
    }

    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await setItem(THEME_MODE_KEY, mode);
}

export async function readThemeMode(): Promise<ThemeMode | null> {
  const value = await getItem(THEME_MODE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}
