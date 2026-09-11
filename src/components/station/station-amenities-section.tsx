import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { theme } from '@/theme';

type AmenityItem = {
  icon: IconName;
  label: string;
};

/**
 * Static amenities shown until the station API exposes amenity data.
 * Replace `STATIC_AMENITIES` with API-driven values when available.
 */
const STATIC_AMENITIES: AmenityItem[] = [
  { icon: 'wifi', label: 'Free WiFi' },
  { icon: 'coffee', label: 'Coffee' },
  { icon: 'dining', label: 'Dining' },
  { icon: 'restroom', label: 'Restrooms' },
];

type StationAmenitiesSectionProps = {
  amenities?: AmenityItem[];
};

export function StationAmenitiesSection({
  amenities = STATIC_AMENITIES,
}: StationAmenitiesSectionProps) {
  if (amenities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Amenities</Text>

      <View style={styles.row}>
        {amenities.map((amenity) => (
          <View key={amenity.label} style={styles.item}>
            <View style={styles.iconCircle}>
              <Icon name={amenity.icon} size={20} color={theme.colors.brand} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {amenity.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  heading: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
