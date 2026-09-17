import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { type Href, router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { ConnectorTag } from '@/components/ui/connector-tag';
import { Icon } from '@/components/ui/icon';
import { getStationImageSource } from '@/data/station-images';
import { theme } from '@/theme';
import type { Station } from '@/types/station';
import {
  formatChargerAvailability,
  formatConnectorTypeLabel,
  formatDistance,
  formatPower,
  formatPricePerKwh,
  formatText,
  getStationAddress,
  getStationStatus,
  hasValue,
  shouldShowStationCity,
} from '@/utils/station';

type StationCardProps = {
  station: Station;
};

const TABLET_BREAKPOINT = 768;
const MAX_CARD_WIDTH = 640;
const IMAGE_HEIGHT = 156;

export function StationCard({ station }: StationCardProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const status = getStationStatus(station);
  const isUnavailable = status.variant === 'unavailable';
  const address = getStationAddress(station);
  const connectors = station.connectors?.filter((c) => hasValue(c.type)) ?? [];
  const imageSource = getStationImageSource(station);
  const chargerLabel = formatChargerAvailability(station);
  const showPower = hasValue(station.maxPowerKw);
  const showDistance = hasValue(station.distanceMi);
  const showCity = shouldShowStationCity(station, address);

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

        <Badge
          label={status.label}
          variant={status.variant}
          showDot={status.variant === 'available'}
          style={styles.statusBadge}
        />

        {station.isFastCharger ? (
          <View style={styles.fastChargerBadge}>
            <Icon name="bolt" size={12} color={theme.colors.textInverse} />
            <Text style={styles.fastChargerText}>Fast Charger</Text>
          </View>
        ) : null}

        {connectors.length > 0 ? (
          <View style={styles.imageConnectorRow}>
            {connectors.map((connector) => (
              <ConnectorTag
                key={connector.type}
                label={formatConnectorTypeLabel(connector.type)}
              />
            ))}
          </View>
        ) : null}

        {showDistance ? (
          <Badge
            label={formatDistance(station.distanceMi)}
            variant="distance"
            style={[
              styles.distanceBadge,
              connectors.length > 0 && styles.distanceBadgeLeft,
            ]}
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {formatText(station.name)}
          </Text>
          <Pressable
            style={styles.navigateButton}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${station.name}`}
          >
            <Icon name="navigate" size={16} color={theme.colors.brand} />
          </Pressable>
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {formatText(address)}
        </Text>

        {showCity ? (
          <Text style={styles.city} numberOfLines={1}>
            {formatText(station.city)}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statColumnLeft}>
            <View style={styles.statItem}>
              <Icon name="price" size={15} color={theme.colors.brand} />
              <Text style={styles.statText} numberOfLines={1}>
                {formatPricePerKwh(station.defaultPricePerKwh, station.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.statColumnCenter}>
            {showPower ? (
              <View style={styles.statItem}>
                <Icon name="bolt" size={15} color={theme.colors.brand} />
                <Text style={styles.statText} numberOfLines={1}>
                  {formatPower(station.maxPowerKw)}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statColumnRight}>
            {chargerLabel ? (
              <View style={styles.statItem}>
                <Icon name="charger" size={15} color={theme.colors.brand} />
                <Text style={styles.statText} numberOfLines={1}>
                  {chargerLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  fastChargerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  imageConnectorRow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    maxWidth: '65%',
  },
  fastChargerText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
    letterSpacing: 0.2,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  distanceBadgeLeft: {
    left: 12,
    right: undefined,
  },
  body: {
    paddingHorizontal: 16,
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
    fontSize: 17,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  address: {
    marginTop: 3,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  city: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  navigateButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginTop: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumnLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  statColumnCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  statColumnRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    maxWidth: '100%',
  },
  statText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    flexShrink: 1,
  },
});
