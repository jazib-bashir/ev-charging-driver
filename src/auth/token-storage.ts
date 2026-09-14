import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'gridflow.driver.access_token';

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

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore web storage failures
    }
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveAccessToken(token: string): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function readAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
}
