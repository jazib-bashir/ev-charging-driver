import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import { NoticeToast } from '@/components/ui/notice-toast';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { theme } from '@/theme';

import { DiscoverySearchToolbar } from './discovery-search-toolbar';
import { FilterBottomSheet } from './filter-bottom-sheet';
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

  const handleViewModeChange = (mode: 'list' | 'map') => {
    if (mode === 'map') {
      router.navigate('/map' as Href);
    }
  };

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
        viewMode="list"
        onViewModeChange={handleViewModeChange}
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
      />

      <ScreenContent style={styles.contentArea}>
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
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    marginTop: theme.spacing.xs,
  },
});
