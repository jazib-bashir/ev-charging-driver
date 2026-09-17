import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationPermissionState = 'undetermined' | 'granted' | 'denied';

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export function mapForegroundPermissionState(
  status: Location.PermissionResponse,
): LocationPermissionState {
  if (status.granted) {
    return 'granted';
  }

  if (status.canAskAgain) {
    return 'undetermined';
  }

  return 'denied';
}

export async function getForegroundPermissionState(): Promise<LocationPermissionState> {
  const status = await Location.getForegroundPermissionsAsync();
  return mapForegroundPermissionState(status);
}

export async function requestForegroundPermission(): Promise<LocationPermissionState> {
  const status = await Location.requestForegroundPermissionsAsync();
  return mapForegroundPermissionState(status);
}

export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Linking.openSettings();
}

/**
 * Requests foreground location permission and returns the device's current
 * coordinates. Throws GeolocationError when permission is denied or GPS fails.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new GeolocationError(
      'Location access is required to filter stations by distance. Enable it in Settings and try again.',
    );
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new GeolocationError('Unable to read your current location. Please try again.');
    }

    return { lat, lng };
  } catch (error) {
    if (error instanceof GeolocationError) {
      throw error;
    }

    throw new GeolocationError('Unable to read your current location. Please try again.');
  }
}

/**
 * Returns current coordinates when permission is already granted.
 * Does not prompt for permission.
 */
export async function getCurrentCoordinatesIfGranted(): Promise<Coordinates | null> {
  const permission = await Location.getForegroundPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
