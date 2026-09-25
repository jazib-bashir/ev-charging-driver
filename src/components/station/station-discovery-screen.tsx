import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import { NoticeToast } from '@/components/ui/notice-toast';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';

import { DiscoveryFilterChips } from './discovery-filter-chips';
import { DiscoverySearchToolbar } from './discovery-search-toolbar';
import { FilterBottomSheet } from './filter-bottom-sheet';
import { LocationPermissionBanner } from './location-permission-banner';
import { StationErrorState } from './station-error-state';
import { StationHeader } from './station-header';
import { StationList } from './station-list';
import { StationLoadingState } from './station-loading-state';

const NOTICE_MESSAGES: Record<string, string> = {
  'profile-incomplete':
    'Complete your profile to book a charger. You can finish it anytime from Profile.',
};

export function StationDiscoveryScreen() {
  const { token } = useAuth();
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

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
    locationError,
    clearLocationError,
    isLocationBannerDismissed,
    dismissLocationBanner,
    hasActiveSearch,
    hasActiveFilters,
    activeFilterCount,
    list,
  } = useStationDiscoveryContext();

  const {
    stations,
    totalCount,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = list;

  useEffect(() => {
    if (notice && NOTICE_MESSAGES[notice]) {
      setNoticeMessage(NOTICE_MESSAGES[notice]);
    }
  }, [notice]);

  const dismissNotice = useCallback(() => {
    setNoticeMessage(null);
  }, []);

  const renderContent = () => {
    if (error && stations.length === 0 && !isInitialLoading) {
      return <StationErrorState onRetry={retry} />;
    }

    if (isInitialLoading) {
      return <StationLoadingState />;
    }

    return (
      <StationList
        stations={stations}
        isRefreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasActiveSearch={hasActiveSearch}
        hasActiveFilters={hasActiveFilters}
        onRefresh={refresh}
        onEndReached={loadMore}
        onClearAllFilters={clearAllFilters}
        onSearchNearby={searchNearby}
      />
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      <StationHeader />
      {noticeMessage ? (
        <NoticeToast message={noticeMessage} onDismiss={dismissNotice} />
      ) : null}
      <DiscoverySearchToolbar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search charging stations..."
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
      />
      <DiscoveryFilterChips />

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

      {locationError ? (
        <NoticeToast message={locationError} onDismiss={clearLocationError} />
      ) : null}

      <ScreenContent>
        {renderContent()}
      </ScreenContent>

      <FilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={closeFilterSheet}
        appliedFilters={advancedFilters}
        onApplyFilters={applyAdvancedFilters}
        onClearAll={clearAllFilters}
        stationCount={totalCount}
        authToken={token}
        locationPermissionStatus={locationPermissionStatus}
        isLocationLoading={isLocationLoading}
        onEnableLocation={enableLocationAccess}
        onOpenLocationSettings={openLocationSettings}
      />
    </ScreenContainer>
  );
}
