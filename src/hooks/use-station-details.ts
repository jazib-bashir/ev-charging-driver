import { useCallback, useEffect, useState } from 'react';

import { fetchPublicStationDetail } from '@/api/publicStations';
import type { Charger } from '@/types/charger';
import type { Station } from '@/types/station';

type StationLoadState = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

type ChargersLoadState = 'idle' | 'loading' | 'success' | 'error';

export function useStationDetails(stationId: string | undefined) {
  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [stationState, setStationState] = useState<StationLoadState>('idle');
  const [chargersState, setChargersState] = useState<ChargersLoadState>('idle');

  const loadStationDetail = useCallback(async () => {
    if (!stationId) {
      setStation(null);
      setChargers([]);
      setStationState('not_found');
      setChargersState('idle');
      return;
    }

    setStationState('loading');
    setChargersState('loading');

    try {
      const result = await fetchPublicStationDetail(stationId);

      if (!result) {
        setStation(null);
        setChargers([]);
        setStationState('not_found');
        setChargersState('idle');
        return;
      }

      setStation(result.station);
      setChargers(result.chargers);
      setStationState('success');
      setChargersState('success');
    } catch {
      setStation(null);
      setChargers([]);
      setStationState('error');
      setChargersState('error');
    }
  }, [stationId]);

  const retryStation = useCallback(() => {
    void loadStationDetail();
  }, [loadStationDetail]);

  const retryChargers = useCallback(() => {
    void loadStationDetail();
  }, [loadStationDetail]);

  /** Soft reload — keeps current UI mounted (for pull-to-refresh). */
  const refresh = useCallback(async () => {
    if (!stationId) {
      return;
    }

    try {
      const result = await fetchPublicStationDetail(stationId);

      if (result) {
        setStation(result.station);
        setChargers(result.chargers);
        setStationState('success');
        setChargersState('success');
      }
    } catch {
      // Keep existing station/chargers on soft-refresh failure.
    }
  }, [stationId]);

  useEffect(() => {
    void loadStationDetail();
  }, [loadStationDetail]);

  return {
    station,
    chargers,
    isStationLoading: stationState === 'loading' || stationState === 'idle',
    isStationError: stationState === 'error',
    isStationNotFound: stationState === 'not_found',
    isChargersLoading: chargersState === 'loading',
    isChargersError: chargersState === 'error',
    retryStation,
    retryChargers,
    refresh,
  };
}
