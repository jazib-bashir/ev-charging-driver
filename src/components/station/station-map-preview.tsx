import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { ConnectorTag } from '@/components/ui/connector-tag';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import { openStationNavigation } from '@/utils/open-station-navigation';
import type { Station } from '@/types/station';
import {
  formatChargerAvailability,
  formatConnectorTypeLabel,
  formatDistanceKm,
  formatPower,
  formatPricePerKwh,
  formatText,
  getStationAddress,
  getStationStatus,
  hasValue,
} from '@/utils/station';

type StationMapPreviewProps = {
  station: Station;
  onViewDetails: () => void;
  variant?: 'embedded' | 'fullscreen';
};

export function StationMapPreview({
  station,
  onViewDetails,
  variant = 'embedded',
}: StationMapPreviewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const status = getStationStatus(station);
  const address = getStationAddress(station);
  const chargerLabel = formatChargerAvailability(station);
  const distanceLabel = hasValue(station.distanceKm)
    ? formatDistanceKm(station.distanceKm)
    : null;
  const connectors = station.connectors?.filter((c) => hasValue(c.type)) ?? [];
  const showPower = hasValue(station.maxPowerKw);
  const showPrice = hasValue(station.defaultPricePerKwh);
  const canNavigate =
    typeof station.latitude === 'number' && typeof station.longitude === 'number';

  return (
    <View
      style={[
        styles.card,
        variant === 'fullscreen' && styles.cardFullscreen,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="charger" size={18} color={theme.colors.textInverse} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {formatText(station.name)}
            </Text>
            <View style={styles.headerTrailing}>
              {status.variant === 'available' ? (
                <View
                  style={[
                    styles.availableBadge,
                    { backgroundColor: theme.colors.statusAvailableBg },
                  ]}
                >
                  <View
                    style={[
                      styles.availableDot,
                      { backgroundColor: theme.colors.statusAvailable },
                    ]}
                  />
                  <Text style={[styles.availableLabel, { color: theme.colors.statusAvailable }]}>
                    {status.label}
                  </Text>
                </View>
              ) : (
                <Badge label={status.label} variant={status.variant} />
              )}
            </View>
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {formatText(address)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {distanceLabel ? (
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={14} color={theme.colors.accent} />
            <Text style={styles.metaEmphasis} numberOfLines={1}>
              {distanceLabel}
            </Text>
          </View>
        ) : null}

        {showPrice ? (
          <View style={styles.metaItem}>
            <Icon name="price" size={14} color={theme.colors.accent} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatPricePerKwh(station.defaultPricePerKwh, station.currency)}
            </Text>
          </View>
        ) : null}

        {showPower ? (
          <View style={styles.metaItem}>
            <Icon name="bolt" size={14} color={theme.colors.statusFast} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatPower(station.maxPowerKw)}
            </Text>
          </View>
        ) : null}

        {chargerLabel ? (
          <View style={styles.metaItem}>
            <Icon name="charger" size={14} color={theme.colors.accent} />
            <Text style={styles.metaEmphasis} numberOfLines={1}>
              {chargerLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {connectors.length > 0 ? (
        <View style={styles.connectorRow}>
          {connectors.slice(0, 4).map((connector) => (
            <ConnectorTag
              key={connector.type}
              label={formatConnectorTypeLabel(connector.type)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => openStationNavigation(station)}
          disabled={!canNavigate}
          accessibilityRole="button"
          accessibilityLabel={`Navigate to station ${station.name}`}
          style={({ pressed }) => [
            styles.navigateButton,
            !canNavigate && styles.actionDisabled,
            pressed && styles.actionPressed,
          ]}
        >
          <Icon name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.navigateLabel}>Navigate to Station</Text>
        </Pressable>

        <Pressable
          onPress={onViewDetails}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${station.name}`}
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.detailsLabel}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      marginHorizontal: 0,
      marginBottom: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
      zIndex: 25,
    },
    cardFullscreen: {
      bottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 18,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    headerTrailing: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    address: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    availableBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
      flexShrink: 0,
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
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.xs,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
      maxWidth: '100%',
    },
    metaText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    metaEmphasis: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
    },
    connectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      gap: 10,
      marginTop: 12,
    },
    navigateButton: {
      flex: 7,
      height: 46,
      backgroundColor: theme.colors.accent,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
    },
    navigateLabel: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 14,
      color: '#FFFFFF',
      includeFontPadding: false,
    },
    detailsButton: {
      flex: 3,
      height: 46,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionDisabled: {
      opacity: 0.55,
    },
  });
}
