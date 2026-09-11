import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { useStationDiscovery } from '@/hooks/use-station-discovery';
import { theme } from '@/theme';
import type { ViewMode } from '@/components/ui/view-toggle';

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
    viewMode,
    setViewMode,
    stations,
    allStations,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    hasActiveSearch,
    hasActiveFilters,
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
            title={hasActiveSearch || hasActiveFilters ? 'No stations found' : 'No charging stations found'}
            message={
              hasActiveSearch || hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Check back later for newly added charging locations.'
            }
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    marginTop: theme.spacing.sm,
  },
});
