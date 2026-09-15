import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MAP_STATION_LIMIT, useStationDiscoveryData } from '@/hooks/use-station-discovery-data';
import type { PublicStationFilterState } from '@/types/station';
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

const LIST_PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

function toggleConnectorType(
  current: string[] | null | undefined,
  connector: string,
  enabled: boolean,
): string[] | null {
  const list = current ?? [];
  if (enabled) {
    if (list.includes(connector)) {
      return list.length > 0 ? list : null;
    }
    const next = [...list, connector];
    return next.length > 0 ? next : null;
  }
  const next = list.filter((item) => item !== connector);
  return next.length > 0 ? next : null;
}

type StationDiscoveryContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  debouncedSearch: string;
  filters: StationFilters;
  toggleFilter: (key: keyof StationFilters) => void;
  advancedFilters: PublicStationFilterState;
  applyAdvancedFilters: (filters: PublicStationFilterState) => void;
  isFilterSheetOpen: boolean;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;
  clearAllFilters: () => void;
  searchNearby: () => Promise<void>;
  locationError: string | null;
  hasActiveSearch: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  /** Stable key that changes when search/filters change — used to refit the map camera. */
  mapCameraFitKey: string;
  list: ReturnType<typeof useStationDiscoveryData>;
  map: ReturnType<typeof useStationDiscoveryData>;
};

const StationDiscoveryContext = createContext<StationDiscoveryContextValue | null>(null);

export function StationDiscoveryProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] =
    useState<PublicStationFilterState>(EMPTY_ADVANCED_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const list = useStationDiscoveryData({
    pageLimit: LIST_PAGE_LIMIT,
    debouncedSearch,
    advancedFilters,
    enablePagination: true,
  });

  const map = useStationDiscoveryData({
    pageLimit: MAP_STATION_LIMIT,
    debouncedSearch,
    advancedFilters,
    enablePagination: false,
  });

  const toggleFilter = useCallback((key: keyof StationFilters) => {
    if (key === 'fast') {
      setAdvancedFilters((prev) => ({
        ...prev,
        isFastCharger: prev.isFastCharger === true ? null : true,
      }));
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
    }
  }, []);

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

  const mapCameraFitKey = useMemo(() => {
    const stationIds = map.stations.map((station) => station.id).join('|');
    return `${debouncedSearch}::${JSON.stringify(advancedFilters)}::${stationIds}`;
  }, [advancedFilters, debouncedSearch, map.stations]);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      debouncedSearch,
      filters: quickChipState,
      toggleFilter,
      advancedFilters,
      applyAdvancedFilters,
      isFilterSheetOpen,
      openFilterSheet,
      closeFilterSheet,
      clearAllFilters,
      searchNearby,
      locationError,
      hasActiveSearch,
      hasActiveFilters: hasActiveAdvancedFilters,
      activeFilterCount,
      mapCameraFitKey,
      list,
      map,
    }),
    [
      activeFilterCount,
      advancedFilters,
      applyAdvancedFilters,
      clearAllFilters,
      closeFilterSheet,
      debouncedSearch,
      hasActiveAdvancedFilters,
      hasActiveSearch,
      isFilterSheetOpen,
      list,
      locationError,
      map,
      mapCameraFitKey,
      openFilterSheet,
      quickChipState,
      searchNearby,
      searchQuery,
      toggleFilter,
    ],
  );

  return (
    <StationDiscoveryContext.Provider value={value}>
      {children}
    </StationDiscoveryContext.Provider>
  );
}

export function useStationDiscoveryContext() {
  const context = useContext(StationDiscoveryContext);

  if (!context) {
    throw new Error('useStationDiscoveryContext must be used within StationDiscoveryProvider');
  }

  return context;
}
