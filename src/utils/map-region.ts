import type { Station } from '@/types/station';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: MapRegion = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 60,
  longitudeDelta: 60,
};

const MIN_DELTA = 0.05;
const REGION_PADDING = 1.3;

export function hasValidCoordinates(station: Station): boolean {
  return (
    typeof station.latitude === 'number'
    && typeof station.longitude === 'number'
    && Number.isFinite(station.latitude)
    && Number.isFinite(station.longitude)
  );
}

export function getStationsWithCoordinates(stations: Station[]): Station[] {
  return stations.filter(hasValidCoordinates);
}

export function getMapRegionForStations(stations: Station[]): MapRegion {
  const validStations = getStationsWithCoordinates(stations);

  if (validStations.length === 0) {
    return DEFAULT_REGION;
  }

  if (validStations.length === 1) {
    const station = validStations[0];
    return {
      latitude: station.latitude!,
      longitude: station.longitude!,
      latitudeDelta: MIN_DELTA,
      longitudeDelta: MIN_DELTA,
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
