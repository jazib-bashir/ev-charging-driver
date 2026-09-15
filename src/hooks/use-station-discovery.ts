/**
 * @deprecated Prefer useStationDiscoveryContext() from @/contexts/station-discovery-context.
 * Kept for compatibility — requires StationDiscoveryProvider in the tree.
 */
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import type { ViewMode } from '@/components/ui/view-toggle';

export { MAP_STATION_LIMIT } from '@/hooks/use-station-discovery-data';

type UseStationDiscoveryOptions = {
  initialViewMode?: ViewMode;
  pageLimit?: number;
};

/** @deprecated Use useStationDiscoveryContext().list or .map instead. */
export function useStationDiscovery(options: UseStationDiscoveryOptions = {}) {
  const { initialViewMode = 'list', pageLimit } = options;
  const context = useStationDiscoveryContext();
  const data = pageLimit && pageLimit > 20 ? context.map : context.list;

  return {
    searchQuery: context.searchQuery,
    setSearchQuery: context.setSearchQuery,
    filters: context.filters,
    toggleFilter: context.toggleFilter,
    advancedFilters: context.advancedFilters,
    applyAdvancedFilters: context.applyAdvancedFilters,
    isFilterSheetOpen: context.isFilterSheetOpen,
    openFilterSheet: context.openFilterSheet,
    closeFilterSheet: context.closeFilterSheet,
    clearAllFilters: context.clearAllFilters,
    searchNearby: context.searchNearby,
    viewMode: initialViewMode,
    setViewMode: () => undefined,
    stations: data.stations,
    allStations: data.stations,
    totalCount: data.totalCount,
    isInitialLoading: data.isInitialLoading,
    isRefreshing: data.isRefreshing,
    isLoadingMore: data.isLoadingMore,
    error: data.error,
    locationError: context.locationError,
    hasMore: data.hasMore,
    hasActiveSearch: context.hasActiveSearch,
    hasActiveFilters: context.hasActiveFilters,
    activeFilterCount: context.activeFilterCount,
    refresh: data.refresh,
    loadMore: data.loadMore,
    retry: data.retry,
  };
}
