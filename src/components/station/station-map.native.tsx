import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import {
  getMapRegionForStations,
  getMapRegionForUserLocation,
  getStationsWithCoordinates,
  LAHORE_DEFAULT_REGION,
} from '@/utils/map-region';
import {
  buildStationMapPoints,
  type StationMapCluster,
} from '@/utils/station-map-clustering';

import { CustomMapStyle } from './custom-map-style';
import { StationClusterMarker, StationMapMarker } from './station-map-marker';
import { StationMapPreview } from './station-map-preview';
import type { StationMapProps } from './station-map';

const MARKER_REDRAW_MS = 1800;

function regionFromCoords(lat: number, lng: number): Region {
  return getMapRegionForUserLocation(lat, lng);
}

function scheduleAfterIdle(callback: () => void): () => void {
  const idle = globalThis.requestIdleCallback;
  if (typeof idle === 'function') {
    const id = idle(() => callback());
    return () => globalThis.cancelIdleCallback?.(id);
  }

  const timer = setTimeout(callback, 0);
  return () => clearTimeout(timer);
}

export function StationMap({
  stations,
  variant = 'embedded',
  cameraFitKey = '',
  userCoords = null,
  onRequestUserLocation,
}: StationMapProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createOverlayStyles(theme), [theme]);
  const mapRef = useRef<MapView>(null);
  const suppressMapPressRef = useRef(false);
  const lastCameraFitKeyRef = useRef<string | null>(null);
  const pendingFitRef = useRef<Region | null>(null);
  const redrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>(LAHORE_DEFAULT_REGION);

  const mappableStations = useMemo(
    () => getStationsWithCoordinates(stations),
    [stations],
  );

  const stationsSignature = useMemo(
    () => mappableStations.map((station) => station.id).join('|'),
    [mappableStations],
  );

  const fitRegion = useMemo(
    () => getMapRegionForStations(stations),
    [stations],
  );

  const selectedStation = useMemo(
    () => mappableStations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, mappableStations],
  );

  const mapPoints = useMemo(
    () =>
      buildStationMapPoints(
        mappableStations,
        region.latitudeDelta,
        selectedStationId,
      ),
    [mappableStations, region.latitudeDelta, selectedStationId],
  );

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
  const useCustomStyle = Boolean(mapProvider) && !isDark;

  const bumpMarkerRedraw = useCallback(() => {
    setTracksViewChanges(true);
    if (redrawTimerRef.current) {
      clearTimeout(redrawTimerRef.current);
    }
    redrawTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      redrawTimerRef.current = null;
    }, MARKER_REDRAW_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (redrawTimerRef.current) {
        clearTimeout(redrawTimerRef.current);
      }
    };
  }, []);

  const applyCameraRegion = useCallback(
    (next: Region, animate: boolean) => {
      setRegion(next);
      bumpMarkerRedraw();

      if (!mapReady) {
        pendingFitRef.current = next;
        return;
      }

      mapRef.current?.animateToRegion(next, animate ? 400 : 0);
    },
    [bumpMarkerRedraw, mapReady],
  );

  // Open on city center. Reframe to station bounds only after search/filter changes.
  useEffect(() => {
    if (!cameraFitKey || mappableStations.length === 0) {
      return;
    }

    if (lastCameraFitKeyRef.current === cameraFitKey) {
      return;
    }

    const isFirstStationPayload = lastCameraFitKeyRef.current === null;
    lastCameraFitKeyRef.current = cameraFitKey;

    if (isFirstStationPayload) {
      applyCameraRegion(LAHORE_DEFAULT_REGION, false);
      return;
    }

    applyCameraRegion(fitRegion, true);
  }, [
    applyCameraRegion,
    cameraFitKey,
    fitRegion,
    mappableStations.length,
  ]);

  // Re-snapshot custom marker views whenever the station set or selection changes.
  useEffect(() => {
    if (!mapReady || mappableStations.length === 0) {
      return;
    }

    return scheduleAfterIdle(() => {
      bumpMarkerRedraw();
    });
  }, [
    bumpMarkerRedraw,
    isDark,
    mapReady,
    selectedStationId,
    stationsSignature,
  ]);

  useEffect(() => {
    if (
      selectedStationId &&
      !mappableStations.some((station) => station.id === selectedStationId)
    ) {
      setSelectedStationId(null);
    }
  }, [mappableStations, selectedStationId]);

  const armMapPressSuppression = useCallback(() => {
    suppressMapPressRef.current = true;
    setTimeout(() => {
      suppressMapPressRef.current = false;
    }, 350);
  }, []);

  const handleSelectStation = useCallback(
    (stationId: string) => {
      armMapPressSuppression();
      setSelectedStationId(stationId);
    },
    [armMapPressSuppression],
  );

  const handleClusterPress = useCallback(
    (cluster: StationMapCluster) => {
      armMapPressSuppression();

      const nextDelta = Math.max(
        region.latitudeDelta / (cluster.stations.length <= 3 ? 4 : 3.2),
        cluster.stations.length <= 3 ? 0.03 : 0.05,
      );
      const nextRegion: Region = {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: nextDelta,
        longitudeDelta: nextDelta,
      };
      mapRef.current?.animateToRegion(nextRegion, 320);
      setRegion(nextRegion);
      bumpMarkerRedraw();
    },
    [armMapPressSuppression, bumpMarkerRedraw, region.latitudeDelta],
  );

  const handleMapPress = useCallback(() => {
    if (suppressMapPressRef.current) {
      return;
    }
    setSelectedStationId(null);
  }, []);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    bumpMarkerRedraw();

    if (pendingFitRef.current) {
      const pending = pendingFitRef.current;
      pendingFitRef.current = null;
      setRegion(pending);
      mapRef.current?.animateToRegion(pending, 350);
    }
  }, [bumpMarkerRedraw]);

  const handleViewDetails = () => {
    if (!selectedStation) {
      return;
    }

    router.push(`/stations/${selectedStation.id}` as Href);
  };

  const handleGoToMyLocation = useCallback(() => {
    armMapPressSuppression();

    if (!userCoords) {
      onRequestUserLocation?.();
      return;
    }

    const nextRegion = regionFromCoords(userCoords.lat, userCoords.lng);
    mapRef.current?.animateToRegion(nextRegion, 400);
    setRegion(nextRegion);
    bumpMarkerRedraw();
  }, [armMapPressSuppression, bumpMarkerRedraw, onRequestUserLocation, userCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={LAHORE_DEFAULT_REGION}
        customMapStyle={useCustomStyle ? CustomMapStyle : undefined}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation
        showsMyLocationButton={false}
        mapPadding={{
          top: variant === 'fullscreen' ? 110 : 0,
          bottom: variant === 'fullscreen' ? 220 : 0,
          left: 16,
          right: 16,
        }}
        onMapReady={handleMapReady}
        onRegionChangeComplete={(next) => {
          setRegion((prev) => {
            if (
              Math.abs(prev.latitudeDelta - next.latitudeDelta) < 0.002 &&
              Math.abs(prev.longitudeDelta - next.longitudeDelta) < 0.002 &&
              Math.abs(prev.latitude - next.latitude) < 0.0004 &&
              Math.abs(prev.longitude - next.longitude) < 0.0004
            ) {
              return prev;
            }
            return next;
          });
          bumpMarkerRedraw();
        }}
        onPress={handleMapPress}
      >
        {mapPoints.map((point) => {
          if (point.kind === 'cluster') {
            const { cluster } = point;
            return (
              <Marker
                key={cluster.id}
                identifier={cluster.id}
                coordinate={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                tracksViewChanges={tracksViewChanges}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={(event) => {
                  event.stopPropagation?.();
                  handleClusterPress(cluster);
                }}
              >
                <StationClusterMarker count={cluster.count} />
              </Marker>
            );
          }

          const { station } = point;
          const selected = selectedStationId === station.id;

          return (
            <Marker
              key={`${station.id}-${selected ? 'selected' : 'idle'}`}
              identifier={station.id}
              coordinate={{
                latitude: station.latitude!,
                longitude: station.longitude!,
              }}
              tracksViewChanges={tracksViewChanges || selected}
              zIndex={selected ? 20 : 2}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(event) => {
                event.stopPropagation?.();
                handleSelectStation(station.id);
              }}
            >
              <StationMapMarker station={station} selected={selected} />
            </Marker>
          );
        })}
      </MapView>

      {selectedStation ? (
        <StationMapPreview
          station={selectedStation}
          onViewDetails={handleViewDetails}
          variant={variant}
        />
      ) : null}

      <Pressable
        onPress={handleGoToMyLocation}
        style={styles.myLocationButton}
        accessibilityRole="button"
        accessibilityLabel="Go to my location"
        hitSlop={6}
      >
        <Icon name="locate" size={22} color={theme.colors.textPrimary} />
      </Pressable>
    </View>
  );
}

function createOverlayStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    myLocationButton: {
      position: 'absolute',
      right: 16,
      bottom: 200,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
      elevation: 8,
      zIndex: 40,
    },
  });
}
