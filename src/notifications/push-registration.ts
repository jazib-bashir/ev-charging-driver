import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  deactivateDriverDeviceToken,
  registerDriverDeviceToken,
} from '@/api/driverDeviceTokens';
import {
  pushRegLog,
  sanitizeRegistrationError,
  summarizeExpoPushToken,
} from '@/notifications/push-registration-debug';

let cachedExpoPushToken: string | null = null;
let lastSyncedRegistrationKey: string | null = null;
let notificationsPermissionExhausted = false;
let registrationInFlight: Promise<void> | null = null;

export function getCachedExpoPushToken(): string | null {
  return cachedExpoPushToken;
}

export function clearCachedExpoPushToken(): void {
  cachedExpoPushToken = null;
  lastSyncedRegistrationKey = null;
}

function supportsPushNotifications(): boolean {
  return Platform.OS === 'android' && Device.isDevice;
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f5f7f9',
  });
}

async function resolveProjectId(): Promise<string | null> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return null;
  }

  return projectId.trim();
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (!supportsPushNotifications()) {
    pushRegLog('ensureNotificationPermission: unsupported platform or not a physical device', {
      platform: Platform.OS,
      isDevice: Device.isDevice,
    });
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  pushRegLog('ensureNotificationPermission: current permission status', {
    granted: current.granted,
    status: current.status,
    canAskAgain: current.canAskAgain,
    notificationsPermissionExhausted,
  });

  if (current.granted) {
    return true;
  }

  if (notificationsPermissionExhausted || current.canAskAgain === false) {
    notificationsPermissionExhausted = true;
    pushRegLog('ensureNotificationPermission: skipped request (exhausted or cannot ask again)');
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  pushRegLog('ensureNotificationPermission: requested permission status', {
    granted: requested.granted,
    status: requested.status,
    canAskAgain: requested.canAskAgain,
  });

  if (requested.granted) {
    return true;
  }

  if (requested.canAskAgain === false) {
    notificationsPermissionExhausted = true;
  }

  return false;
}

async function fetchExpoPushToken(): Promise<string | null> {
  pushRegLog('fetchExpoPushToken: enter', {
    platform: Platform.OS,
    isDevice: Device.isDevice,
  });

  if (!supportsPushNotifications()) {
    pushRegLog('fetchExpoPushToken: exit (unsupported)', {
      platform: Platform.OS,
      isDevice: Device.isDevice,
    });
    return null;
  }

  await ensureAndroidNotificationChannel();
  pushRegLog('fetchExpoPushToken: notification channel ensured');

  const hasPermission = await ensureNotificationPermission();

  if (!hasPermission) {
    pushRegLog('fetchExpoPushToken: exit (notification permission not granted)');
    return null;
  }

  const projectId = await resolveProjectId();
  pushRegLog('fetchExpoPushToken: project id resolution', {
    projectIdResolved: Boolean(projectId),
  });

  if (!projectId) {
    pushRegLog('fetchExpoPushToken: exit (missing Expo project id)');
    return null;
  }

  let pushToken: Notifications.ExpoPushToken;

  try {
    pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch (error) {
    pushRegLog('fetchExpoPushToken: exit (getExpoPushTokenAsync failed)', {
      error: sanitizeRegistrationError(error),
    });
    return null;
  }

  const expoPushToken = pushToken.data?.trim();
  pushRegLog('fetchExpoPushToken: expo push token obtained', {
    tokenObtained: Boolean(expoPushToken),
    tokenPreview: summarizeExpoPushToken(expoPushToken),
  });

  if (!expoPushToken) {
    pushRegLog('fetchExpoPushToken: exit (empty expo push token)');
    return null;
  }

  cachedExpoPushToken = expoPushToken;
  pushRegLog('fetchExpoPushToken: exit (success)');
  return expoPushToken;
}

async function syncRegistration(
  accessToken: string,
  expoPushTokenOverride?: string,
): Promise<void> {
  pushRegLog('syncRegistration: enter', {
    hasAccessToken: Boolean(accessToken.trim()),
    usingTokenOverride: Boolean(expoPushTokenOverride?.trim()),
  });

  const expoPushToken = expoPushTokenOverride ?? (await fetchExpoPushToken());

  if (!expoPushToken) {
    pushRegLog('syncRegistration: exit (no expo push token)');
    return;
  }

  cachedExpoPushToken = expoPushToken;

  const registrationKey = `${accessToken}:${expoPushToken}`;

  if (registrationKey === lastSyncedRegistrationKey) {
    pushRegLog('syncRegistration: exit (already synced for this session)', {
      tokenPreview: summarizeExpoPushToken(expoPushToken),
    });
    return;
  }

  pushRegLog('syncRegistration: calling device-token API', {
    tokenPreview: summarizeExpoPushToken(expoPushToken),
  });

  await registerDriverDeviceToken(accessToken, expoPushToken);
  lastSyncedRegistrationKey = registrationKey;
  pushRegLog('syncRegistration: exit (device-token API success)');
}

export function syncPushTokenRegistration(
  accessToken: string,
  expoPushTokenOverride?: string,
): Promise<void> {
  pushRegLog('syncPushTokenRegistration: enter', {
    hasAccessToken: Boolean(accessToken.trim()),
    platform: Platform.OS,
    isDevice: Device.isDevice,
    registrationInFlight: Boolean(registrationInFlight),
    usingTokenOverride: Boolean(expoPushTokenOverride?.trim()),
  });

  if (!accessToken.trim()) {
    pushRegLog('syncPushTokenRegistration: exit (guard: missing access token)');
    return Promise.resolve();
  }

  const overrideToken = expoPushTokenOverride?.trim();

  if (overrideToken && cachedExpoPushToken && cachedExpoPushToken !== overrideToken) {
    lastSyncedRegistrationKey = null;
  }

  if (!supportsPushNotifications()) {
    pushRegLog('syncPushTokenRegistration: exit (guard: unsupported platform or not a physical device)', {
      platform: Platform.OS,
      isDevice: Device.isDevice,
    });
    return Promise.resolve();
  }

  if (registrationInFlight) {
    pushRegLog('syncPushTokenRegistration: reusing in-flight registration');
    return registrationInFlight;
  }

  registrationInFlight = syncRegistration(accessToken, expoPushTokenOverride)
    .catch((error) => {
      pushRegLog('syncPushTokenRegistration: registration failed', {
        error: sanitizeRegistrationError(error),
      });
      lastSyncedRegistrationKey = null;
      // Registration failures should not break auth or navigation flows.
    })
    .finally(() => {
      registrationInFlight = null;
      pushRegLog('syncPushTokenRegistration: exit (in-flight complete)');
    });

  return registrationInFlight;
}

export async function deactivatePushTokenRegistration(
  accessToken: string,
): Promise<void> {
  const expoPushToken = cachedExpoPushToken;

  if (!expoPushToken || !accessToken.trim()) {
    clearCachedExpoPushToken();
    return;
  }

  try {
    await deactivateDriverDeviceToken(accessToken, expoPushToken);
  } catch {
    // Logout must proceed even when deactivation fails.
  } finally {
    clearCachedExpoPushToken();
  }
}
