import type { ImageSource } from 'expo-image';

import type { Station } from '@/types/station';

/**
 * Static local images for station cards.
 * Kept separate from API data so it can be removed when real station images are available.
 */
const STATION_IMAGE_ASSETS: ImageSource[] = [
  require('@/assets/images/stations/charger-2.jpg'),
  require('@/assets/images/stations/mark-station.jpg'),
  require('@/assets/images/stations/charger-6.png'),
];

function getStableImageIndex(stationId: string): number {
  let hash = 0;
  for (let index = 0; index < stationId.length; index += 1) {
    hash = (hash + stationId.charCodeAt(index)) % STATION_IMAGE_ASSETS.length;
  }
  return hash;
}

export function getStationImageSource(station: Station): ImageSource {
  if (station.imageUrl) {
    return { uri: station.imageUrl };
  }

  const imageIndex = getStableImageIndex(station.id);
  return STATION_IMAGE_ASSETS[imageIndex % STATION_IMAGE_ASSETS.length];
}
