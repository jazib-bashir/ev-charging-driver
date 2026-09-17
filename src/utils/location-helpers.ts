export const DISTANCE_OPTIONS = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 },
  { label: '100km', value: 100 },
];

export const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Gujranwala',
  'Hyderabad',
  'Quetta',
  'Sialkot',
  'Bahawalpur',
];

/** Default city chips for the driver app (Pakistan). */
export const DEFAULT_FALLBACK_CITIES = PAKISTAN_CITIES;

/**
 * Returns popular cities for the filter sheet.
 * Defaults to Pakistani cities; still switches by coords when available.
 */
export function getPopularCitiesByLocation(lat?: number | null, lng?: number | null): string[] {
  let countryCode = 'PK';

  if (typeof lat === 'number' && typeof lng === 'number') {
    if (lat >= 23 && lat <= 37 && lng >= 61 && lng <= 78) {
      countryCode = 'PK';
    } else if (lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154) {
      countryCode = 'AU';
    } else if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      countryCode = 'UK';
    } else if (lat >= 35 && lat <= 46 && lng >= 129 && lng <= 146) {
      countryCode = 'JP';
    } else if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
      countryCode = 'US';
    }
  }

  switch (countryCode) {
    case 'AU':
      return [
        'Sydney',
        'Melbourne',
        'Brisbane',
        'Perth',
        'Adelaide',
        'Gold Coast',
        'Newcastle',
      ];
    case 'UK':
      return [
        'London',
        'Birmingham',
        'Manchester',
        'Glasgow',
        'Newcastle',
        'Sheffield',
        'Liverpool',
      ];
    case 'JP':
      return [
        'Tokyo',
        'Yokohama',
        'Osaka',
        'Nagoya',
        'Sapporo',
        'Fukuoka',
        'Kobe',
      ];
    case 'US':
      return [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Phoenix',
        'Philadelphia',
        'San Antonio',
      ];
    case 'PK':
    default:
      return PAKISTAN_CITIES;
  }
}

/**
 * Async wrapper used by the filter sheet to load city chips.
 */
export async function getCitiesForUser(
  lat?: number | null,
  lng?: number | null,
): Promise<string[]> {
  return getPopularCitiesByLocation(lat, lng);
}

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceKmBetween(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
): number {
  const latDelta = toRadians(targetLat - originLat);
  const lngDelta = toRadians(targetLng - originLng);
  const originLatRad = toRadians(originLat);
  const targetLatRad = toRadians(targetLat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(originLatRad) *
      Math.cos(targetLatRad) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function attachDistancesToStations<T extends {
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
}>(
  stations: T[],
  originLat: number,
  originLng: number,
): T[] {
  return stations.map((station) => {
    if (
      typeof station.latitude !== 'number' ||
      !Number.isFinite(station.latitude) ||
      typeof station.longitude !== 'number' ||
      !Number.isFinite(station.longitude)
    ) {
      return station;
    }

    return {
      ...station,
      distanceKm: distanceKmBetween(
        originLat,
        originLng,
        station.latitude,
        station.longitude,
      ),
    };
  });
}

export function sortStationsByDistance<T extends { distanceKm?: number | null }>(
  stations: T[],
): T[] {
  return [...stations].sort((left, right) => {
    const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;
    return leftDistance - rightDistance;
  });
}
