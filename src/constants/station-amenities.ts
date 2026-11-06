import type { IconName } from '@/components/ui/icon';

export type StationAmenityDefinition = {
  id: string;
  label: string;
  icon: IconName;
};

/**
 * Frontend-owned station amenities catalog.
 * IDs must match Dashboard/Operator; labels/icons are UI-only.
 */
export const STATION_AMENITIES: readonly StationAmenityDefinition[] = [
  { id: 'cafe', label: 'Café', icon: 'coffee' },
  { id: 'restaurant', label: 'Restaurant', icon: 'dining' },
  { id: 'restrooms', label: 'Restrooms', icon: 'restroom' },
  { id: 'waiting_area', label: 'Waiting Area', icon: 'waiting-area' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'covered_parking', label: 'Covered Parking', icon: 'car' },
  { id: 'convenience_store', label: 'Convenience Store', icon: 'store' },
  { id: 'security_24_7', label: '24/7 Security', icon: 'shield' },
] as const;

const AMENITY_BY_ID = new Map(
  STATION_AMENITIES.map((amenity) => [amenity.id, amenity] as const),
);

export function resolveStationAmenities(
  amenityIds: string[] | null | undefined,
): StationAmenityDefinition[] {
  if (!Array.isArray(amenityIds) || amenityIds.length === 0) {
    return [];
  }

  return amenityIds.flatMap((id) => {
    const amenity = AMENITY_BY_ID.get(id);
    return amenity ? [amenity] : [];
  });
}
