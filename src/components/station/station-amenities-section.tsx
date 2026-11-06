import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type AmenityItem = {
  id?: string;
  icon: IconName;
  label: string;
};

type StationAmenitiesSectionProps = {
  amenities?: AmenityItem[];
};

export function StationAmenitiesSection({
  amenities = [],
}: StationAmenitiesSectionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (amenities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Amenities</Text>

      <View style={styles.row}>
        {amenities.map((amenity) => (
          <View key={amenity.id ?? amenity.label} style={styles.item}>
            <View style={styles.iconTile}>
              <Icon name={amenity.icon} size={22} color={theme.colors.accent} />
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

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: 14,
    },
    item: {
      alignItems: 'center',
      gap: 8,
      width: 64,
    },
    iconTile: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });
}
