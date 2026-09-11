import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchPublicStations } from '@/api/publicStations';
import type { ViewMode } from '@/components/ui/view-toggle';
import type { Station } from '@/types/station';
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
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [stations, setStations] = useState<Station[]>([]);
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

  const loadStations = useCallback(async ({
    nextOffset,
    search,
    append,
    refresh = false,
  }: {
    nextOffset: number;
    search: string;
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
      const response = await fetchPublicStations({
        limit: PAGE_LIMIT,
        offset: nextOffset,
        all: false,
        search: search || undefined,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setStations((current) => (
        append ? [...current, ...response.data] : response.data
      ));
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
  }, []);

  useEffect(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      append: false,
    });
  }, [debouncedSearch, loadStations]);

  const filteredStations = useMemo(
    () => applyStationFilters(stations, '', filters),
    [stations, filters],
  );

  const toggleFilter = (key: keyof StationFilters) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const refresh = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      append: false,
      refresh: true,
    });
  }, [debouncedSearch, loadStations]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMoreRef.current || isInitialLoading || isRefreshing) {
      return;
    }

    const nextOffset = offset + PAGE_LIMIT;
    loadStations({
      nextOffset,
      search: debouncedSearch,
      append: true,
    });
  }, [debouncedSearch, hasMore, isInitialLoading, isRefreshing, loadStations, offset]);

  const retry = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      append: false,
    });
  }, [debouncedSearch, loadStations]);

  const hasActiveSearch = debouncedSearch.length > 0;
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
    viewMode,
    setViewMode,
    stations: filteredStations,
    allStations: stations,
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
  };
}
