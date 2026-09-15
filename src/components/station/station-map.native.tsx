import { type Href, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import {
  getMapRegionForStations,
  getStationsWithCoordinates,
  LAHORE_DEFAULT_REGION,
} from '@/utils/map-region';

import { StationMapPreview } from './station-map-preview';
import type { StationMapProps } from './station-map';

export function StationMap({
  stations,
  variant = 'embedded',
  cameraFitKey = '',
}: StationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const lastCameraFitKeyRef = useRef<string | null>(null);

  const mappableStations = useMemo(
    () => getStationsWithCoordinates(stations),
    [stations],
  );

  const fitRegion = useMemo(
    () => getMapRegionForStations(stations),
    [stations],
  );

  const selectedStation = useMemo(
    () => mappableStations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, mappableStations],
  );

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

  useEffect(() => {
    if (!cameraFitKey || mappableStations.length === 0) {
      return;
    }

    if (lastCameraFitKeyRef.current === cameraFitKey) {
      return;
    }

    lastCameraFitKeyRef.current = cameraFitKey;
    mapRef.current?.animateToRegion(fitRegion, 350);
  }, [cameraFitKey, fitRegion, mappableStations.length]);

  useEffect(() => {
    if (
      selectedStationId &&
      !mappableStations.some((station) => station.id === selectedStationId)
    ) {
      setSelectedStationId(null);
    }
  }, [mappableStations, selectedStationId]);

  const handleViewDetails = () => {
    if (!selectedStation) {
      return;
    }

    router.push(`/stations/${selectedStation.id}` as Href);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={LAHORE_DEFAULT_REGION}
        mapPadding={{
          top: variant === 'fullscreen' ? 72 : 0,
          bottom: variant === 'fullscreen' ? 200 : 0,
          left: 16,
          right: 16,
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
            onPress={(event) => {
              event.stopPropagation();
              setSelectedStationId(station.id);
            }}
          >
            <View
              style={[
                styles.marker,
                selectedStationId === station.id && styles.markerSelected,
              ]}
            >
              <Icon name="charger" size={16} color={theme.colors.textInverse} />
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedStation ? (
        <StationMapPreview
          station={selectedStation}
          onViewDetails={handleViewDetails}
          variant={variant}
        />
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
});
