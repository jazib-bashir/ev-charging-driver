import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectorTag } from '@/components/ui/connector-tag';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import { openStationNavigation } from '@/utils/open-station-navigation';
import type { Station } from '@/types/station';
import {
  formatBayAvailability,
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
  const chargerLabel = formatBayAvailability(station);
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
          <Icon name="charger" size={18} color={theme.colors.onPrimary} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {formatText(station.name)}
            </Text>
            <View style={styles.headerTrailing}>
              <Badge
                label={status.label}
                variant={status.variant}
                showDot={status.variant === 'available'}
              />
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
            <Icon name="map-pin" size={14} color={theme.colors.primary} />
            <Text style={styles.metaEmphasis} numberOfLines={1}>
              {distanceLabel}
            </Text>
          </View>
        ) : null}

        {showPrice ? (
          <View style={styles.metaItem}>
            <Icon name="price" size={14} color={theme.colors.primary} />
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
            <Icon name="charger" size={14} color={theme.colors.primary} />
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
        <View style={styles.navigateWrap}>
          <Button
            label="Navigate"
            leadingIcon="navigate"
            disabled={!canNavigate}
            onPress={() => openStationNavigation(station)}
            accessibilityLabel={`Navigate to station ${station.name}`}
          />
        </View>
        <Button
          label="Details"
          variant="secondary"
          fullWidth={false}
          onPress={onViewDetails}
          accessibilityLabel={`View details for ${station.name}`}
        />
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
      borderRadius: theme.radius.xxl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      ...theme.shadows.floating,
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
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
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
    navigateWrap: {
      flex: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      gap: 10,
      marginTop: 12,
    },
  });
}
