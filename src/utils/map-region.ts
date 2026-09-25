import type { Station } from '@/types/station';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Lahore city center — used when the map first opens. */
export const LAHORE_DEFAULT_REGION: MapRegion = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** Neighborhood-scale zoom used when centering on the driver's GPS position. */
export const USER_LOCATION_REGION_DELTA = 0.045;

export function getMapRegionForUserLocation(
  latitude: number,
  longitude: number,
): MapRegion {
  return {
    latitude,
    longitude,
    latitudeDelta: USER_LOCATION_REGION_DELTA,
    longitudeDelta: USER_LOCATION_REGION_DELTA,
  };
}

const MIN_DELTA = 0.08;
const SINGLE_STATION_DELTA = 0.12;
const REGION_PADDING = 1.35;

export function hasValidCoordinates(station: Station): boolean {
  return (
    typeof station.latitude === 'number'
    && typeof station.longitude === 'number'
    && Number.isFinite(station.latitude)
    && Number.isFinite(station.longitude)
  );
}

export function getStationsWithCoordinates(stations: Station[]): Station[] {
  const seen = new Set<string>();
  const result: Station[] = [];

  for (const station of stations) {
    if (!hasValidCoordinates(station) || !station.id || seen.has(station.id)) {
      continue;
    }

    seen.add(station.id);
    result.push(station);
  }

  return result;
}

export function getMapRegionForStations(stations: Station[]): MapRegion {
  const validStations = getStationsWithCoordinates(stations);

  if (validStations.length === 0) {
    return LAHORE_DEFAULT_REGION;
  }

  if (validStations.length === 1) {
    const station = validStations[0];
    return {
      latitude: station.latitude!,
      longitude: station.longitude!,
      latitudeDelta: SINGLE_STATION_DELTA,
      longitudeDelta: SINGLE_STATION_DELTA,
    };
  }

  const latitudes = validStations.map((station) => station.latitude!);
  const longitudes = validStations.map((station) => station.longitude!);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitudeDelta = Math.max((maxLat - minLat) * REGION_PADDING, MIN_DELTA);
  const longitudeDelta = Math.max((maxLng - minLng) * REGION_PADDING, MIN_DELTA);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
