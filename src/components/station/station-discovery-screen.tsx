import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
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
import { StationMap } from './station-map';

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
    setViewMode,
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

  const renderContent = () => {
    if (error && allStations.length === 0 && !isInitialLoading) {
      return <StationErrorState onRetry={retry} />;
    }

    if (isInitialLoading) {
      return <StationLoadingState />;
    }

    if (viewMode === 'map') {
      if (stations.length === 0) {
        return (
          <EmptyState
            title="No Stations Found"
            message={
              hasActiveSearch || hasActiveFilters
                ? 'Try adjusting your filters or searching in a different area to find a place to charge.'
                : 'Check back later for newly added charging locations.'
            }
            iconName="search-off"
            primaryActionLabel={
              hasActiveSearch || hasActiveFilters ? 'Clear All Filters' : undefined
            }
            onPrimaryAction={clearAllFilters}
            secondaryActionLabel="Search Nearby"
            onSecondaryAction={searchNearby}
          />
        );
      }

      return <StationMap stations={stations} />;
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
        onViewModeChange={setViewMode}
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
