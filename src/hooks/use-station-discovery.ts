import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchPublicStations } from '@/api/publicStations';
import type { ViewMode } from '@/components/ui/view-toggle';
import type { PublicStationFilterState, Station } from '@/types/station';
import { GeolocationError, getCurrentCoordinates } from '@/utils/geolocation';
import type { StationFilters } from '@/utils/station';

const EMPTY_ADVANCED_FILTERS: PublicStationFilterState = {
  radiusKm: null,
  city: null,
  isPrimarySite: null,
  lat: null,
  lng: null,
  connectorTypes: null,
  isFastCharger: null,
  vehicleId: null,
  sortBy: null,
  sortOrder: null,
};

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

type UseStationDiscoveryOptions = {
  initialViewMode?: ViewMode;
};

function toggleConnectorType(
  current: string[] | null | undefined,
  connector: string,
  enabled: boolean,
): string[] | null {
  const list = current ?? [];
  if (enabled) {
    if (list.includes(connector)) return list.length > 0 ? list : null;
    const next = [...list, connector];
    return next.length > 0 ? next : null;
  }
  const next = list.filter((item) => item !== connector);
  return next.length > 0 ? next : null;
}

export function useStationDiscovery(options: UseStationDiscoveryOptions = {}) {
  const { initialViewMode = 'list' } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] =
    useState<PublicStationFilterState>(EMPTY_ADVANCED_FILTERS);
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
  const [locationError, setLocationError] = useState<string | null>(null);

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
        const hasCoords =
          typeof currentAdvancedFilters.lat === 'number' &&
          Number.isFinite(currentAdvancedFilters.lat) &&
          typeof currentAdvancedFilters.lng === 'number' &&
          Number.isFinite(currentAdvancedFilters.lng);

        const lat = hasRadius && hasCoords ? currentAdvancedFilters.lat! : undefined;
        const lng = hasRadius && hasCoords ? currentAdvancedFilters.lng! : undefined;

        const connectorTypes = (currentAdvancedFilters.connectorTypes ?? []).filter(Boolean);

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
          vehicleId: currentAdvancedFilters.vehicleId || undefined,
          connectorType: connectorTypes.length > 0 ? connectorTypes.join(',') : undefined,
          isFastCharger:
            typeof currentAdvancedFilters.isFastCharger === 'boolean'
              ? currentAdvancedFilters.isFastCharger
              : undefined,
          sortBy: currentAdvancedFilters.sortBy || undefined,
          sortOrder: currentAdvancedFilters.sortBy
            ? currentAdvancedFilters.sortOrder || undefined
            : undefined,
          lat,
          lng,
          radius: hasRadius && hasCoords ? currentAdvancedFilters.radiusKm! : undefined,
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

  const toggleFilter = useCallback((key: keyof StationFilters) => {
    if (key === 'fast') {
      setAdvancedFilters((prev) => {
        const nextIsFastCharger = prev.isFastCharger === true ? null : true;
        return {
          ...prev,
          isFastCharger: nextIsFastCharger,
        };
      });
      return;
    }

    if (key === 'tesla') {
      setAdvancedFilters((prev) => {
        const enabled = !(prev.connectorTypes ?? []).includes('NACS');
        return {
          ...prev,
          connectorTypes: toggleConnectorType(prev.connectorTypes, 'NACS', enabled),
        };
      });
      return;
    }

    if (key === 'ccs') {
      setAdvancedFilters((prev) => {
        const enabled = !(prev.connectorTypes ?? []).includes('CCS2');
        return {
          ...prev,
          connectorTypes: toggleConnectorType(prev.connectorTypes, 'CCS2', enabled),
        };
      });
    }
  }, []);

  const applyAdvancedFilters = useCallback((newFilters: PublicStationFilterState) => {
    setLocationError(null);
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
    setAdvancedFilters(EMPTY_ADVANCED_FILTERS);
    setLocationError(null);
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const searchNearby = useCallback(async () => {
    setLocationError(null);
    try {
      const coords = await getCurrentCoordinates();
      setAdvancedFilters((prev) => ({
        ...prev,
        radiusKm: 10,
        lat: coords.lat,
        lng: coords.lng,
        city: null,
      }));
    } catch (err) {
      const message =
        err instanceof GeolocationError
          ? err.message
          : 'Unable to read your current location. Please try again.';
      setLocationError(message);
      setError(message);
    }
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

  const quickChipState: StationFilters = useMemo(
    () => ({
      fast: Boolean(advancedFilters.isFastCharger),
      tesla: (advancedFilters.connectorTypes ?? []).includes('NACS'),
      ccs: (advancedFilters.connectorTypes ?? []).includes('CCS2'),
    }),
    [advancedFilters.connectorTypes, advancedFilters.isFastCharger],
  );

  const hasActiveSearch = debouncedSearch.length > 0;
  const hasActiveAdvancedFilters = Boolean(
    advancedFilters.radiusKm ||
      advancedFilters.city ||
      typeof advancedFilters.isPrimarySite === 'boolean' ||
      typeof advancedFilters.isFastCharger === 'boolean' ||
      (advancedFilters.connectorTypes && advancedFilters.connectorTypes.length > 0) ||
      advancedFilters.vehicleId ||
      advancedFilters.sortBy,
  );

  const activeFilterCount =
    (advancedFilters.radiusKm ? 1 : 0) +
    (advancedFilters.city ? 1 : 0) +
    (typeof advancedFilters.isPrimarySite === 'boolean' ? 1 : 0) +
    (typeof advancedFilters.isFastCharger === 'boolean' ? 1 : 0) +
    (advancedFilters.connectorTypes?.length ? 1 : 0) +
    (advancedFilters.vehicleId ? 1 : 0) +
    (advancedFilters.sortBy ? 1 : 0);

  return {
    searchQuery,
    setSearchQuery,
    filters: quickChipState,
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
    allStations: stations,
    totalCount: totalCount ?? stations.length,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    locationError,
    hasMore,
    hasActiveSearch,
    hasActiveFilters: hasActiveAdvancedFilters,
    activeFilterCount,
    refresh,
    loadMore,
    retry,
  };
}
