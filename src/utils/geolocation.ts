import * as Location from 'expo-location';

export type Coordinates = {
  lat: number;
  lng: number;
};

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

/**
 * Requests foreground location permission and returns the device's current
 * coordinates. Throws GeolocationError when permission is denied or GPS fails.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new GeolocationError(
      'Location permission is required to search by distance. Enable it in Settings and try again.',
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
