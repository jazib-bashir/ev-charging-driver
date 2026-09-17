import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { ConnectorTag } from '@/components/ui/connector-tag';
import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { Station } from '@/types/station';
import {
  formatChargerAvailability,
  formatConnectorTypeLabel,
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
  const status = getStationStatus(station);
  const address = getStationAddress(station);
  const chargerLabel = formatChargerAvailability(station);
  const connectors = station.connectors?.filter((c) => hasValue(c.type)) ?? [];
  const showPower = hasValue(station.maxPowerKw);
  const showPrice = hasValue(station.defaultPricePerKwh);

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
            <Badge label={status.label} variant={status.variant} showDot={status.variant === 'available'} />
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {formatText(address)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {showPrice ? (
          <View style={styles.metaItem}>
            <Icon name="price" size={14} color={theme.colors.brand} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatPricePerKwh(station.defaultPricePerKwh, station.currency)}
            </Text>
          </View>
        ) : null}

        {showPower ? (
          <View style={styles.metaItem}>
            <Icon name="bolt" size={14} color={theme.colors.brand} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatPower(station.maxPowerKw)}
            </Text>
          </View>
        ) : null}

        {chargerLabel ? (
          <View style={styles.metaItem}>
            <Icon name="charger" size={14} color={theme.colors.brand} />
            <Text style={styles.metaText} numberOfLines={1}>{chargerLabel}</Text>
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

      <Pressable
        onPress={onViewDetails}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${station.name}`}
        style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
      >
        <Text style={styles.detailsButtonLabel}>View Details</Text>
        <Icon name="chevron-forward" size={16} color={theme.colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  cardFullscreen: {
    bottom: theme.spacing.xl,
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
    backgroundColor: theme.colors.selectionForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  address: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
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
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  connectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  detailsButtonPressed: {
    opacity: 0.92,
  },
  detailsButtonLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
});
