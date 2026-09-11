import { type Href, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import { formatText, getStationAddress } from '@/utils/station';
import { getMapRegionForStations, getStationsWithCoordinates } from '@/utils/map-region';

import type { StationMapProps } from './station-map';

export function StationMap({ stations, variant = 'embedded' }: StationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const mappableStations = useMemo(
    () => getStationsWithCoordinates(stations),
    [stations],
  );

  const mapRegion = useMemo(
    () => getMapRegionForStations(stations),
    [stations],
  );

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, stations],
  );

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

  useEffect(() => {
    if (mappableStations.length === 0) {
      return;
    }

    mapRef.current?.animateToRegion(mapRegion, 350);
  }, [mapRegion, mappableStations.length]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={mapRegion}
        mapPadding={{
          top: variant === 'fullscreen' ? 72 : 0,
          bottom: variant === 'fullscreen' ? 120 : 0,
          left: 0,
          right: 0,
        }}
        onPress={() => setSelectedStationId(null)}
      >
        {mappableStations.map((station) => (
          <Marker
            key={station.id}
            identifier={station.id}
            coordinate={{
              latitude: station.latitude!,
              longitude: station.longitude!,
            }}
            onPress={() => setSelectedStationId(station.id)}
          >
            <View
              style={[
                styles.marker,
                selectedStationId === station.id && styles.markerSelected,
              ]}
            >
              <Icon name="charger" size={16} color={theme.colors.textInverse} />
            </View>
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {formatText(station.name)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {selectedStation ? (
        <Pressable
          onPress={() => router.push(`/stations/${selectedStation.id}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${selectedStation.name}`}
          style={({ pressed }) => [
            styles.selectedCard,
            variant === 'fullscreen' && styles.selectedCardFullscreen,
            pressed && styles.selectedCardPressed,
          ]}
        >
          <View style={styles.selectedCardHeader}>
            <View style={styles.selectedCardIcon}>
              <Icon name="charger" size={18} color={theme.colors.textInverse} />
            </View>
            <View style={styles.selectedCardCopy}>
              <Text style={styles.selectedCardTitle} numberOfLines={1}>
                {formatText(selectedStation.name)}
              </Text>
              <Text style={styles.selectedCardAddress} numberOfLines={2}>
                {formatText(getStationAddress(selectedStation))}
              </Text>
            </View>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    ...theme.shadows.badge,
  },
  markerSelected: {
    backgroundColor: theme.colors.brandDark,
    transform: [{ scale: 1.08 }],
  },
  callout: {
    minWidth: 120,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  selectedCard: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  selectedCardFullscreen: {
    bottom: theme.spacing.xl,
  },
  selectedCardPressed: {
    opacity: 0.94,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectedCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.selectionForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCardCopy: {
    flex: 1,
    gap: 2,
  },
  selectedCardTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  selectedCardAddress: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});
