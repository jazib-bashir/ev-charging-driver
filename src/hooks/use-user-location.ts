import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  type Coordinates,
  GeolocationError,
  getCurrentCoordinates,
  getCurrentCoordinatesIfGranted,
  getForegroundPermissionState,
  type LocationPermissionState,
  openLocationSettings,
  requestForegroundPermission,
} from '@/utils/geolocation';

type UseUserLocationOptions = {
  /** When true, reads coordinates after permission is already granted. */
  hydrateOnGrant?: boolean;
};

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const { hydrateOnGrant = true } = options;
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionState>('undetermined');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await getForegroundPermissionState();
    setPermissionStatus(status);
    return status;
  }, []);

  const hydrateCoordinates = useCallback(async () => {
    const nextCoords = await getCurrentCoordinatesIfGranted();
    setCoords(nextCoords);
    return nextCoords;
  }, []);

  const enableLocation = useCallback(async (): Promise<Coordinates> => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await requestForegroundPermission();
      setPermissionStatus(status);

      if (status !== 'granted') {
        throw new GeolocationError(
          'Location access is required to filter stations by distance. Enable it in Settings and try again.',
        );
      }

      const nextCoords = await getCurrentCoordinates();
      setCoords(nextCoords);
      return nextCoords;
    } catch (err) {
      const message =
        err instanceof GeolocationError
          ? err.message
          : 'Unable to read your current location. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshLocation = useCallback(async (): Promise<Coordinates> => {
    if (permissionStatus !== 'granted') {
      return enableLocation();
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextCoords = await getCurrentCoordinates();
      setCoords(nextCoords);
      return nextCoords;
    } catch (err) {
      const message =
        err instanceof GeolocationError
          ? err.message
          : 'Unable to read your current location. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [enableLocation, permissionStatus]);

  useEffect(() => {
    void (async () => {
      const status = await refreshPermissionStatus();
      if (hydrateOnGrant && status === 'granted') {
        await hydrateCoordinates();
      }
    })();
  }, [hydrateCoordinates, hydrateOnGrant, refreshPermissionStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      void (async () => {
        const status = await refreshPermissionStatus();
        if (status === 'granted') {
          await hydrateCoordinates();
        }
      })();
    });

    return () => subscription.remove();
  }, [hydrateCoordinates, refreshPermissionStatus]);

  return {
    permissionStatus,
    coords,
    isLoading,
    error,
    isLocationGranted: permissionStatus === 'granted',
    hasCoordinates: coords !== null,
    refreshPermissionStatus,
    hydrateCoordinates,
    enableLocation,
    refreshLocation,
    openLocationSettings,
  };
}
