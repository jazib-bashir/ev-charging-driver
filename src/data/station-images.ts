import type { ImageSource } from 'expo-image';

import type { Station } from '@/types/station';

/**
 * Local demo images keyed by station id.
 * When the API provides imageUrl, that takes precedence.
 */
export const stationImageAssets: Record<string, ImageSource> = {
  '6aa2bc39799688a97ec3146f': require('@/assets/images/stations/charger-2.jpg'),
  '6aa3ba01799688a97ec31473': require('@/assets/images/stations/mark-station.jpg'),
  '6aa3f59eba100f9f30563a99': require('@/assets/images/stations/charger-6.png'),
};

export function getStationImageSource(station: Station): ImageSource | null {
  if (station.imageUrl) {
    return { uri: station.imageUrl };
  }

  return stationImageAssets[station.id] ?? null;
}
