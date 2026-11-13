import type { MapStyleElement } from 'react-native-maps';

/**
 * Light-mode Google Maps style: soft neutral canvas with a faint emerald tint
 * on parks and water so station markers stay the visual focus.
 * Applied when PROVIDER_GOOGLE is active.
 */
export const CustomMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#F5F8F7' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5B6B66' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#EEF3F1' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#F5F8F7' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#E3ECE8' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D5EDE3' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DDE7E3' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#DDE7E3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C4DAD4' }] },
];

/** Dark-mode counterpart tuned to the obsidian surface palette. */
export const CustomDarkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#111821' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A9A94' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1117' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#151D26' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#17222B' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#12281F' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E2933' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A3A44' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1E2933' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1A1D' }] },
];
