import { useCallback, useEffect, useState } from 'react';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import type { Charger } from '@/types/charger';
import type { Station } from '@/types/station';

type StationLoadState = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

type ChargersLoadState = 'idle' | 'loading' | 'success' | 'error';

export function useStationDetails(stationId: string | undefined) {
  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [stationState, setStationState] = useState<StationLoadState>('idle');
  const [chargersState, setChargersState] = useState<ChargersLoadState>('idle');

  const loadStation = useCallback(async () => {
    if (!stationId) {
      setStation(null);
      setStationState('not_found');
      return;
    }

    setStationState('loading');

    try {
      const result = await fetchPublicStation(stationId);

      if (!result) {
        setStation(null);
        setStationState('not_found');
        return;
      }

      setStation(result);
      setStationState('success');
    } catch {
      setStation(null);
      setStationState('error');
    }
  }, [stationId]);

  const loadChargers = useCallback(async () => {
    if (!stationId) {
      setChargers([]);
      setChargersState('idle');
      return;
    }

    setChargersState('loading');

    try {
      const result = await fetchPublicChargers({ stationId });
      setChargers(result.data);
      setChargersState('success');
    } catch {
      setChargers([]);
      setChargersState('error');
    }
  }, [stationId]);

  const retryStation = useCallback(() => {
    void loadStation();
  }, [loadStation]);

  const retryChargers = useCallback(() => {
    void loadChargers();
  }, [loadChargers]);

  useEffect(() => {
    void loadStation();
  }, [loadStation]);

  useEffect(() => {
    if (stationState === 'success' && stationId) {
      void loadChargers();
    }
  }, [stationState, stationId, loadChargers]);

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
  };
}
