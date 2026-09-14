export const DISTANCE_OPTIONS = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 },
  { label: '100km', value: 100 },
];

export const DEFAULT_FALLBACK_CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
];

/**
 * Determines the country based on coordinates and returns the 7 largest/popular cities.
 */
export function getPopularCitiesByLocation(lat?: number | null, lng?: number | null): string[] {
  let countryCode = 'US';

  if (typeof lat === 'number' && typeof lng === 'number') {
    if (lat >= 23 && lat <= 37 && lng >= 61 && lng <= 78) {
      countryCode = 'PK';
    } else if (lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154) {
      countryCode = 'AU';
    } else if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      countryCode = 'UK';
    } else if (lat >= 35 && lat <= 46 && lng >= 129 && lng <= 146) {
      countryCode = 'JP';
    }
  }

  switch (countryCode) {
    case 'PK':
      return [
        'Karachi',
        'Lahore',
        'Faisalabad',
        'Rawalpindi',
        'Gujranwala',
        'Peshawar',
        'Multan',
      ];
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
    default:
      return DEFAULT_FALLBACK_CITIES;
  }
}

/**
 * Async wrapper used by the filter sheet to load nearby popular cities.
 */
export async function getCitiesForUser(
  lat?: number | null,
  lng?: number | null,
): Promise<string[]> {
  return getPopularCitiesByLocation(lat, lng);
}
