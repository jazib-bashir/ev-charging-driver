import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { LocationPermissionBanner } from './location-permission-banner';
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
    isLocationBannerDismissed,
    dismissLocationBanner,
    userCoords,
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
  const showExpoGoNotice = isExpoGoAndroid();
  const hasActiveDiscovery = hasActiveSearch || hasActiveFilters;

  const handleBackToList = () => {
    router.navigate('/' as Href);
  };

  return (
    <ScreenContainer edges={['top']} style={styles.screen}>
      <StationHeader variant="map" onBack={handleBackToList} />

      <View style={styles.mapStage}>
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
              userCoords={userCoords}
              onRequestUserLocation={() => {
                void enableLocationAccess().catch(() => undefined);
              }}
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

        <View style={styles.floatingChrome} pointerEvents="box-none">
          <DiscoverySearchToolbar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search on map..."
            onFilterPress={openFilterSheet}
            activeFilterCount={activeFilterCount}
            floating
          />
          <DiscoveryFilterChips floating />
          {!isLocationBannerDismissed ? (
            <LocationPermissionBanner
              permissionStatus={locationPermissionStatus}
              isLoading={isLocationLoading}
              onEnableLocation={() => {
                void enableLocationAccess().catch(() => undefined);
              }}
              onOpenSettings={() => {
                void openLocationSettings();
              }}
              onDismiss={dismissLocationBanner}
            />
          ) : null}
        </View>
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
    mapStage: {
      flex: 1,
      backgroundColor: theme.colors.placeholder,
    },
    floatingChrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: 'transparent',
    },
    errorWrap: {
      flex: 1,
    },
  });
}
