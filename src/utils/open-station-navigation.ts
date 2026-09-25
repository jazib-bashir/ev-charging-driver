import { Linking, Platform } from 'react-native';

import type { Station } from '@/types/station';

/** Opens Apple/Google Maps navigation to the station coordinates. */
export function openStationNavigation(station: Station) {
  const lat = station.latitude;
  const lng = station.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return;
  }

  const label = encodeURIComponent(station.name || 'Charging station');
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
      : Platform.OS === 'android'
        ? `google.navigation:q=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  void Linking.openURL(url);
}
