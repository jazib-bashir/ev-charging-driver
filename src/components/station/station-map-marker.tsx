import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import type { Station } from '@/types/station';
import { formatPower, getStationStatus, hasValue } from '@/utils/station';

export type MarkerAvailability = 'available' | 'limited' | 'unavailable';

export function getMarkerAvailability(station: Station): MarkerAvailability {
  const status = getStationStatus(station);

  if (status.variant === 'unavailable') {
    return 'unavailable';
  }

  if (status.variant === 'neutral') {
    return 'limited';
  }

  const total = station.chargerCount;
  const free = station.availableChargers;

  if (hasValue(total) && hasValue(free) && Number(total) > 0) {
    const freeCount = Number(free);
    if (freeCount <= 0) {
      return 'limited';
    }
    if (freeCount / Number(total) <= 0.25) {
      return 'limited';
    }
  }

  return 'available';
}

type StationMapMarkerProps = {
  station: Station;
  selected?: boolean;
};

export function StationMapMarker({ station, selected = false }: StationMapMarkerProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  const availability = getMarkerAvailability(station);
  const powerLabel = hasValue(station.maxPowerKw)
    ? formatPower(station.maxPowerKw)
    : '—';

  const accent =
    availability === 'available'
      ? theme.colors.statusAvailable
      : availability === 'limited'
        ? theme.colors.statusFast
        : theme.colors.textMuted;

  const muted = availability === 'unavailable' && !selected;

  const iconColor = selected
    ? theme.colors.textPrimary
    : muted
      ? theme.colors.textMuted
      : accent;
  const powerColor = selected
    ? theme.colors.textPrimary
    : muted
      ? theme.colors.textMuted
      : theme.colors.textPrimary;
  const dotColor = selected ? theme.colors.textPrimary : accent;

  return (
    <View
      style={[
        styles.marker,
        muted && styles.markerMuted,
        selected
          ? {
              backgroundColor: theme.colors.accent,
              borderColor: theme.colors.accent,
              paddingHorizontal: compact ? 10 : 11,
              paddingVertical: compact ? 5 : 6,
              shadowColor: theme.colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 5,
              shadowOffset: { width: 0, height: 3 },
              elevation: 6,
            }
          : null,
      ]}
      collapsable={false}
    >
      <Icon name="bolt" size={selected ? (compact ? 12 : 13) : compact ? 11 : 12} color={iconColor} />
      <Text
        style={[
          styles.power,
          selected && styles.powerSelected,
          { color: powerColor },
        ]}
        numberOfLines={1}
      >
        {powerLabel}
      </Text>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </View>
  );
}

type ClusterMarkerProps = {
  count: number;
};

export function StationClusterMarker({ count }: ClusterMarkerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createClusterStyles(theme), [theme]);

  return (
    <View style={styles.wrap} collapsable={false}>
      <View style={styles.halo} />
      <View style={styles.cluster}>
        <Text style={styles.count}>{count > 99 ? '99+' : String(count)}</Text>
      </View>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  compact: boolean,
) {
  return StyleSheet.create({
    marker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: compact ? 8 : 9,
      paddingVertical: compact ? 4 : 5,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    markerMuted: {
      backgroundColor: theme.colors.iconBackground,
      borderColor: theme.colors.border,
      opacity: 0.92,
    },
    power: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: compact ? 11 : 12,
      letterSpacing: 0.1,
      includeFontPadding: false,
    },
    powerSelected: {
      fontSize: compact ? 12 : 13,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      marginLeft: 1,
    },
  });
}

function createClusterStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
    },
    halo: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 217, 160, 0.16)',
    },
    cluster: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 4,
    },
    count: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 12,
      color: theme.colors.textPrimary,
      includeFontPadding: false,
    },
  });
}
