import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchPublicStations } from '@/api/publicStations';
import type { PublicStationFilterState, Station } from '@/types/station';

/** Max stations fetched for the map discovery view (single request, no pagination). */
export const MAP_STATION_LIMIT = 100;

type UseStationDiscoveryDataOptions = {
  pageLimit: number;
  debouncedSearch: string;
  advancedFilters: PublicStationFilterState;
  /** When false, only the first page is fetched (map mode). */
  enablePagination?: boolean;
};

export function useStationDiscoveryData({
  pageLimit,
  debouncedSearch,
  advancedFilters,
  enablePagination = true,
}: UseStationDiscoveryDataOptions) {
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
        if (isLoadingMoreRef.current) {
          return;
        }
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
          limit: pageLimit,
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
        setHasMore(enablePagination ? (response.pagination?.hasMore ?? false) : false);
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
    [enablePagination, pageLimit],
  );

  useEffect(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
    });
  }, [advancedFilters, debouncedSearch, loadStations]);

  const refresh = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
      refresh: true,
    });
  }, [advancedFilters, debouncedSearch, loadStations]);

  const loadMore = useCallback(() => {
    if (
      !enablePagination ||
      !hasMore ||
      isLoadingMoreRef.current ||
      isInitialLoading ||
      isRefreshing
    ) {
      return;
    }

    const nextOffset = offset + pageLimit;
    loadStations({
      nextOffset,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: true,
    });
  }, [
    advancedFilters,
    debouncedSearch,
    enablePagination,
    hasMore,
    isInitialLoading,
    isRefreshing,
    loadStations,
    offset,
    pageLimit,
  ]);

  const retry = useCallback(() => {
    loadStations({
      nextOffset: 0,
      search: debouncedSearch,
      currentAdvancedFilters: advancedFilters,
      append: false,
    });
  }, [advancedFilters, debouncedSearch, loadStations]);

  return {
    stations,
    totalCount: totalCount ?? stations.length,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  };
}
