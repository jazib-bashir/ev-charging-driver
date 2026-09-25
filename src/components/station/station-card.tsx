import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { getStationImageSource } from '@/data/station-images';
import { useTheme } from '@/theme';
import type { Station } from '@/types/station';
import { formatCurrencyAmount } from '@/utils/charging-session-format';
import {
  formatConnectorTypeLabel,
  formatDistanceKm,
  formatText,
  getStationAddress,
  getStationStatus,
  hasChargerCount,
  hasValue,
} from '@/utils/station';

type StationCardProps = {
  station: Station;
};

const TABLET_BREAKPOINT = 768;
const MAX_CARD_WIDTH = 640;
const IMAGE_HEIGHT = 168;

export function StationCard({ station }: StationCardProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isTablet = width >= TABLET_BREAKPOINT;
  const accent = theme.colors.accent;

  const status = getStationStatus(station);
  const isUnavailable = status.variant === 'unavailable';
  const imageSource = getStationImageSource(station);
  const connectors = station.connectors?.filter((c) => hasValue(c.type)) ?? [];
  const primaryConnector = connectors[0];

  const distanceLabel = hasValue(station.distanceKm)
    ? formatDistanceKm(station.distanceKm)
    : null;
  const address = getStationAddress(station);
  const addressLabel = hasValue(address) ? formatText(address) : null;
  const locationLine = [distanceLabel, addressLabel].filter(Boolean).join(' · ');

  const priceValue =
    station.defaultPricePerKwh === null || station.defaultPricePerKwh === undefined
      ? '—'
      : formatCurrencyAmount(station.defaultPricePerKwh, station.currency);

  const powerValue = hasValue(station.maxPowerKw) ? `${station.maxPowerKw} kW` : '—';

  const totalChargers = station.chargerCount;
  const availableChargers = station.availableChargers;
  const baysValue =
    hasChargerCount(totalChargers) && hasValue(availableChargers)
      ? `${availableChargers}/${totalChargers}`
      : hasChargerCount(totalChargers)
        ? `${totalChargers}`
        : '—';

  const handlePress = () => {
    router.push(`/stations/${station.id}` as Href);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${station.name}`}
      style={({ pressed }) => [
        styles.card,
        isTablet && styles.cardTablet,
        { maxWidth: isTablet ? MAX_CARD_WIDTH : undefined },
        isUnavailable && styles.cardUnavailable,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={[styles.image, isUnavailable && styles.imageUnavailable]}
          contentFit="cover"
          transition={200}
        />

        {status.variant === 'available' ? (
          <View
            style={[
              styles.statusBadge,
              styles.availableBadge,
              { backgroundColor: theme.colors.statusAvailableBg },
            ]}
          >
            <View
              style={[styles.availableDot, { backgroundColor: theme.colors.statusAvailable }]}
            />
            <Text style={[styles.availableLabel, { color: theme.colors.statusAvailable }]}>
              {status.label}
            </Text>
          </View>
        ) : (
          <Badge
            label={status.label}
            variant={status.variant}
            style={styles.statusBadge}
          />
        )}

        {station.isFastCharger ? (
          <View style={styles.fastBadge}>
            <Icon name="bolt" size={11} color={theme.colors.statusFast} />
            <Text style={[styles.fastText, { color: theme.colors.statusFast }]}>Fast</Text>
          </View>
        ) : null}

        {primaryConnector ? (
          <View style={styles.connectorBadge}>
            <Text style={styles.connectorText}>
              {formatConnectorTypeLabel(primaryConnector.type)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {formatText(station.name)}
          </Text>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${station.name}`}
            style={styles.navigateButton}
          >
            <Icon name="navigate-outline" size={16} color={accent} />
          </Pressable>
        </View>

        {locationLine ? (
          <View style={styles.locationRow}>
            <Icon name="map-pin" size={12} color={theme.colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <StatCell
            value={priceValue}
            label="per kWh"
            valueColor={accent}
            styles={styles}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={powerValue}
            label="max power"
            icon={<Icon name="bolt" size={11} color={theme.colors.statusFast} />}
            styles={styles}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={baysValue}
            label="bays free"
            valueColor={accent}
            styles={styles}
          />
        </View>
      </View>
    </Pressable>
  );
}

type CardStyles = ReturnType<typeof createStyles>;

type StatCellProps = {
  value: string;
  label: string;
  valueColor?: string;
  icon?: ReactNode;
  styles: CardStyles;
};

function StatCell({ value, label, valueColor, icon, styles }: StatCellProps) {
  return (
    <View style={styles.statCell}>
      <View style={styles.statValueRow}>
        {icon}
        <Text
          style={[styles.statValue, valueColor ? { color: valueColor } : null]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    cardTablet: {
      alignSelf: 'center',
      width: '100%',
    },
    cardUnavailable: {
      opacity: 0.88,
    },
    cardPressed: {
      opacity: 0.94,
    },
    imageContainer: {
      position: 'relative',
      height: IMAGE_HEIGHT,
      backgroundColor: theme.colors.placeholder,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageUnavailable: {
      opacity: 0.5,
    },
    statusBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
    },
    availableBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
    },
    availableDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    availableLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      letterSpacing: 0.2,
      fontWeight: '600',
    },
    fastBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: 'rgba(6, 12, 24, 0.78)',
    },
    fastText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.2,
      color: theme.colors.statusFast,
    },
    connectorBadge: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(6, 12, 24, 0.78)',
    },
    connectorText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 16,
      color: '#ffffff',
    },
    body: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    name: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 20.8,
      color: theme.colors.textPrimary,
      letterSpacing: 0,
    },
    navigateButton: {
      width: 32,
      height: 32,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: 'rgba(0, 217, 160, 0.45)',
      backgroundColor: 'rgba(0, 217, 160, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    locationText: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginTop: 12,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 2,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingHorizontal: 4,
      minWidth: 0,
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      maxWidth: '100%',
    },
    statValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    statLabel: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.textMuted,
    },
  });
}
