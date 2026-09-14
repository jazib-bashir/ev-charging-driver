import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { SearchInput } from '@/components/ui/search-input';
import type { ViewMode } from '@/components/ui/view-toggle';
import { useStationDiscovery } from '@/hooks/use-station-discovery';
import { theme } from '@/theme';

import { FilterBottomSheet } from './filter-bottom-sheet';
import { FilterRow } from './filter-row';
import { StationErrorState } from './station-error-state';
import { StationHeader } from './station-header';
import { StationList } from './station-list';
import { StationLoadingState } from './station-loading-state';

type StationDiscoveryScreenProps = {
  initialViewMode?: ViewMode;
};

export function StationDiscoveryScreen({
  initialViewMode = 'list',
}: StationDiscoveryScreenProps) {
  const {
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
    advancedFilters,
    applyAdvancedFilters,
    isFilterSheetOpen,
    openFilterSheet,
    closeFilterSheet,
    clearAllFilters,
    searchNearby,
    viewMode,
    stations,
    allStations,
    totalCount,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    hasActiveSearch,
    hasActiveFilters,
    activeFilterCount,
    refresh,
    loadMore,
    retry,
  } = useStationDiscovery({ initialViewMode });

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === 'map') {
      router.navigate('/map' as Href);
      return;
    }
  };

  const renderContent = () => {
    if (error && allStations.length === 0 && !isInitialLoading) {
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
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search charging stations..."
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
      />
      <FilterRow
        filters={filters}
        viewMode={viewMode}
        onToggleFilter={toggleFilter}
        onViewModeChange={handleViewModeChange}
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
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    marginTop: theme.spacing.sm,
  },
});
