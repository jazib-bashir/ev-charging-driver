import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { getStationsWithCoordinates } from '@/utils/map-region';
import { useTheme } from '@/theme';
import { isExpoGoAndroid } from '@/utils/runtime';

import { DiscoveryFilterChips } from './discovery-filter-chips';
import { DiscoverySearchToolbar } from './discovery-search-toolbar';
import { FilterBottomSheet } from './filter-bottom-sheet';
import { MapExpoGoNotice } from './map-expo-go-notice';
import { MapLoadingState } from './map-loading-state';
import { StationErrorState } from './station-error-state';
import { StationHeader } from './station-header';
import { StationMap } from './station-map';

export function StationMapScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { token } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    advancedFilters,
    applyAdvancedFilters,
    isFilterSheetOpen,
    openFilterSheet,
    closeFilterSheet,
    clearAllFilters,
    searchNearby,
    enableLocationAccess,
    openLocationSettings,
    locationPermissionStatus,
    isLocationLoading,
    hasActiveSearch,
    hasActiveFilters,
    activeFilterCount,
    mapCameraFitKey,
    map,
    list,
  } = useStationDiscoveryContext();

  const {
    stations,
    isInitialLoading,
    error,
    retry,
  } = map;

  const mappableCount = getStationsWithCoordinates(stations).length;
  const stationCount = stations.length;
  const showExpoGoNotice = isExpoGoAndroid();
  const hasActiveDiscovery = hasActiveSearch || hasActiveFilters;

  const handleBackToList = () => {
    router.navigate('/' as Href);
  };

  const subtitle =
    !isInitialLoading && !error
      ? mappableCount === 0
        ? stationCount === 1
          ? '1 station'
          : `${stationCount} stations`
        : mappableCount === stationCount
          ? mappableCount === 1
            ? '1 station on map'
            : `${mappableCount} stations on map`
          : `${mappableCount} of ${stationCount} on map`
      : null;

  return (
    <ScreenContainer edges={['top']} style={styles.screen}>
      <StationHeader variant="map" onBack={handleBackToList} />

      <DiscoverySearchToolbar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search on map..."
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
      />
      <DiscoveryFilterChips />

      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}

      <View style={styles.mapArea}>
        {isInitialLoading ? <MapLoadingState /> : null}

        {!isInitialLoading && error && stations.length === 0 ? (
          <View style={styles.errorWrap}>
            <StationErrorState onRetry={retry} />
          </View>
        ) : null}

        {!isInitialLoading && !error && stations.length === 0 ? (
          <EmptyState
            title={hasActiveDiscovery ? 'No stations found' : 'No charging stations found'}
            message={
              hasActiveDiscovery
                ? 'Try adjusting your filters or searching in a different area.'
                : 'Check back later for newly added charging locations.'
            }
            iconName="search-off"
            primaryActionLabel={hasActiveDiscovery ? 'Clear All Filters' : undefined}
            onPrimaryAction={clearAllFilters}
            secondaryActionLabel="Search Nearby"
            onSecondaryAction={searchNearby}
          />
        ) : null}

        {!isInitialLoading && !error && mappableCount > 0 ? (
          <>
            <StationMap
              stations={stations}
              variant="fullscreen"
              cameraFitKey={mapCameraFitKey}
            />
            {showExpoGoNotice ? <MapExpoGoNotice /> : null}
          </>
        ) : null}

        {!isInitialLoading && !error && stations.length > 0 && mappableCount === 0 ? (
          <EmptyState
            title="No mappable stations"
            message="Stations were found but none have valid map coordinates yet."
          />
        ) : null}
      </View>

      <FilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={closeFilterSheet}
        appliedFilters={advancedFilters}
        onApplyFilters={applyAdvancedFilters}
        onClearAll={clearAllFilters}
        stationCount={list.totalCount}
        authToken={token}
        locationPermissionStatus={locationPermissionStatus}
        isLocationLoading={isLocationLoading}
        onEnableLocation={enableLocationAccess}
        onOpenLocationSettings={openLocationSettings}
      />
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    subtitle: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
    },
    mapArea: {
      flex: 1,
      backgroundColor: theme.colors.placeholder,
    },
    errorWrap: {
      flex: 1,
    },
  });
}
