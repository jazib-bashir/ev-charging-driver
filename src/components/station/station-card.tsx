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
  formatDistance,
  formatPower,
  formatPricePerKwh,
  formatText,
  getStationAddress,
  getStationStatus,
  hasValue,
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
  const showCity = hasValue(station.city);

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

        {showDistance && (
          <Badge
            label={formatDistance(station.distanceMi)}
            variant="distance"
            style={styles.distanceBadge}
          />
        )}
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

        <Text style={styles.address} numberOfLines={1}>
          {formatText(address)}
        </Text>

        {showCity ? (
          <Text style={styles.city} numberOfLines={1}>
            {formatText(station.city)}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="price" size={15} color={theme.colors.brand} />
            <Text style={styles.metaText}>{formatPricePerKwh(station.defaultPricePerKwh)}</Text>
          </View>

          {showPower && (
            <View style={styles.metaItem}>
              <Icon name="bolt" size={15} color={theme.colors.brand} />
              <Text style={styles.metaText}>{formatPower(station.maxPowerKw)}</Text>
            </View>
          )}

          {chargerLabel && (
            <View style={styles.metaItem}>
              <Icon name="charger" size={15} color={theme.colors.brand} />
              <Text style={styles.metaText}>{chargerLabel}</Text>
            </View>
          )}

          <View style={styles.connectorSlot}>
            {connectors.length > 0
              ? connectors.map((connector) => (
                <ConnectorTag
                  key={connector.type}
                  label={connector.label ?? connector.type}
                />
              ))
              : <Text style={styles.metaText}>N/A</Text>}
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
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.placeholder,
  },
  imageUnavailable: {
    opacity: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
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
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginTop: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  connectorSlot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    flexShrink: 0,
    marginLeft: 4,
  },
});
