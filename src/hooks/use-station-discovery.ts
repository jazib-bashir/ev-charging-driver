import { useMemo, useState } from 'react';

import stationsData from '@/data/stations.json';
import type { Station, StationsResponse } from '@/types/station';
import {
  applyStationFilters,
  type StationFilters,
} from '@/utils/station';

import type { ViewMode } from '@/components/ui/view-toggle';

const DEFAULT_FILTERS: StationFilters = {
  fast: false,
  available: false,
  tesla: false,
  ccs: false,
};

export function useStationDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const stations = useMemo(
    () => (stationsData as StationsResponse).data,
    [],
  );

  const filteredStations = useMemo(
    () => applyStationFilters(stations, searchQuery, filters),
    [stations, searchQuery, filters],
  );

  const toggleFilter = (key: keyof StationFilters) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  return {
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
    viewMode,
    setViewMode,
    stations: filteredStations as Station[],
  };
}
