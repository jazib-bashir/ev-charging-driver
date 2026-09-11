import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { Station } from '@/types/station';
import { formatText } from '@/utils/station';
import { getMapRegionForStations, getStationsWithCoordinates } from '@/utils/map-region';

type StationMapProps = {
  stations: Station[];
};

export function StationMap({ stations }: StationMapProps) {
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
        style={styles.map}
        initialRegion={mapRegion}
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

      {selectedStationId ? (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedBannerText} numberOfLines={1}>
            {formatText(
              stations.find((station) => station.id === selectedStationId)?.name,
            )}
          </Text>
        </View>
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
  selectedBanner: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  selectedBannerText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
