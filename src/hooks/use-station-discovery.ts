import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchPublicStations } from '@/api/publicStations';
import type { ViewMode } from '@/components/ui/view-toggle';
import type { PublicStationFilterState, Station } from '@/types/station';
import {
  applyStationFilters,
  type StationFilters,
} from '@/utils/station';

const DEFAULT_FILTERS: StationFilters = {
  fast: false,
  available: false,
  tesla: false,
  ccs: false,
};

const DEFAULT_ADVANCED_FILTERS: PublicStationFilterState = {
  radiusKm: null,
  city: null,
  isPrimarySite: null,
  lat: 31.4697,
  lng: 74.2728,
};

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

type UseStationDiscoveryOptions = {
  initialViewMode?: ViewMode;
};

export function useStationDiscovery(options: UseStationDiscoveryOptions = {}) {
  const { initialViewMode = 'list' } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [advancedFilters, setAdvancedFilters] =
    useState<PublicStationFilterState>(DEFAULT_ADVANCED_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [stations, setStations] = useState<Station[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadStations = useCallback(
    async ({
      nextOffset,
      search,
      currentAdvancedFilters,
      append,
      refresh = false,
    }: {
      nextOffset: number;
      search: string;
      currentAdvancedFilters: PublicStationFilterState;
      append: boolean;
      refresh?: boolean;
    }) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (append) {
        if (isLoadingMoreRef.current) return;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      setError(null);

      try {
        const hasRadius =
          typeof currentAdvancedFilters.radiusKm === 'number' &&
          currentAdvancedFilters.radiusKm > 0;
        const lat = hasRadius
          ? (currentAdvancedFilters.lat ?? DEFAULT_ADVANCED_FILTERS.lat ?? undefined)
          : undefined;
        const lng = hasRadius
          ? (currentAdvancedFilters.lng ?? DEFAULT_ADVANCED_FILTERS.lng ?? undefined)
          : undefined;

        const response = await fetchPublicStations({
          limit: PAGE_LIMIT,
          offset: nextOffset,
          all: false,
          search: search || undefined,
          city: currentAdvancedFilters.city || undefined,
          isPrimarySite:
            typeof currentAdvancedFilters.isPrimarySite === 'boolean'
              ? currentAdvancedFilters.isPrimarySite
              : undefined,
          lat,
          lng,
          radius: hasRadius ? (currentAdvancedFilters.radiusKm ?? undefined) : undefined,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setStations((current) =>
          append ? [...current, ...response.data] : response.data,
        );
        setTotalCount(response.pagination?.total);
        setOffset(nextOffset);
        setHasMore(response.pagination?.hasMore ?? false);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!append) {
          setStations([]);
        }
        setError('Unable to load stations');
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (append) {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        } else if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
    });
  }, [debouncedSearch, advancedFilters, loadStations]);

  const filteredStations = useMemo(
    () => applyStationFilters(stations, '', filters),
    [stations, filters],
  );

  const toggleFilter = (key: keyof StationFilters) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const applyAdvancedFilters = useCallback((newFilters: PublicStationFilterState) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const openFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(true);
  }, []);

  const closeFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAdvancedFilters({
      radiusKm: null,
      city: null,
      isPrimarySite: null,
      lat: DEFAULT_ADVANCED_FILTERS.lat,
      lng: DEFAULT_ADVANCED_FILTERS.lng,
    });
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const searchNearby = useCallback(() => {
    setAdvancedFilters((prev) => ({
      ...prev,
      radiusKm: 10,
      lat: DEFAULT_ADVANCED_FILTERS.lat,
      lng: DEFAULT_ADVANCED_FILTERS.lng,
      city: null,
    }));
  }, []);

  const refresh = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
      refresh: true,
    });
  }, [debouncedSearch, advancedFilters, loadStations]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMoreRef.current || isInitialLoading || isRefreshing) {
      return;
    }

    const nextOffset = offset + PAGE_LIMIT;
    loadStations({
      nextOffset,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: true,
    });
  }, [
    debouncedSearch,
    advancedFilters,
    hasMore,
    isInitialLoading,
    isRefreshing,
    loadStations,
    offset,
  ]);

  const retry = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
    });
  }, [debouncedSearch, advancedFilters, loadStations]);

  const hasActiveSearch = debouncedSearch.length > 0;
  const hasActiveQuickFilters = Object.values(filters).some(Boolean);
  const hasActiveAdvancedFilters = Boolean(
    advancedFilters.radiusKm ||
    advancedFilters.city ||
    typeof advancedFilters.isPrimarySite === 'boolean',
  );

  const activeFilterCount =
    (Object.values(filters).filter(Boolean).length) +
    (advancedFilters.radiusKm ? 1 : 0) +
    (advancedFilters.city ? 1 : 0) +
    (typeof advancedFilters.isPrimarySite === 'boolean' ? 1 : 0);

  return {
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
    stations: filteredStations,
    allStations: stations,
    totalCount: totalCount ?? filteredStations.length,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    hasActiveSearch,
    hasActiveFilters: hasActiveQuickFilters || hasActiveAdvancedFilters,
    activeFilterCount,
    refresh,
    loadMore,
    retry,
  };
}

