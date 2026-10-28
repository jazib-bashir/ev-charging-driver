import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { listDriverQueueMembers } from '@/api/stationQueue';
import { fetchPublicStation } from '@/api/publicStations';
import { AuthApiError } from '@/api/auth';
import type { QueueMember } from '@/types/queue';
import { subscribeQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import { selectPrimaryActiveQueueMembership } from '@/utils/select-primary-queue-membership';
import {
  useDebouncedGridflowRealtimeHandler,
  useGridflowRealtimeReconnectSnapshot,
  useGridflowRealtimeStation,
} from '@/realtime/gridflow-realtime-provider';
import { GridflowRealtimeEventKind } from '@/realtime/gridflow-realtime-types';

type UseActiveDriverQueueMembershipOptions = {
  token: string | null;
  refreshOnAppForeground?: boolean;
  seedMembership?: QueueMember | null;
  seedStationName?: string;
  journeyLookupFailed?: boolean;
  authJourneySeedKey?: string | null;
};

export function useActiveDriverQueueMembership({
  token,
  refreshOnAppForeground = true,
  seedMembership,
  seedStationName,
  journeyLookupFailed = false,
  authJourneySeedKey,
}: UseActiveDriverQueueMembershipOptions) {
  const [membership, setMembership] = useState<QueueMember | null>(seedMembership ?? null);
  const [stationName, setStationName] = useState<string | undefined>(seedStationName);
  const [isLoading, setIsLoading] = useState(!seedMembership);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef(0);

  useGridflowRealtimeStation(membership?.stationId);

  useEffect(() => {
    if (journeyLookupFailed || authJourneySeedKey == null) {
      return;
    }

    if (seedMembership) {
      setMembership(seedMembership);
      setStationName(seedStationName);
      setIsLoading(false);
      return;
    }

    setMembership(null);
    setStationName(undefined);
    setIsLoading(false);
  }, [
    authJourneySeedKey,
    journeyLookupFailed,
    seedMembership,
    seedStationName,
  ]);

  const load = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!token) {
        setMembership(null);
        setStationName(undefined);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++loadRequestRef.current;
      const showLoading = options?.showLoading ?? true;

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const members = await listDriverQueueMembers(token);

        if (requestId !== loadRequestRef.current) {
          return;
        }

        const primary = selectPrimaryActiveQueueMembership(members);
        setMembership(primary);

        if (!primary) {
          setStationName(undefined);
          return;
        }

        try {
          const station = await fetchPublicStation(primary.stationId);

          if (requestId !== loadRequestRef.current) {
            return;
          }

          setStationName(station?.name);
        } catch {
          if (requestId !== loadRequestRef.current) {
            return;
          }

          setStationName(undefined);
        }
      } catch (loadError) {
        if (requestId !== loadRequestRef.current) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Failed to load queue membership';
        setError(message);

        if (!journeyLookupFailed) {
          setMembership(null);
          setStationName(undefined);
        }
      } finally {
        if (requestId === loadRequestRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [journeyLookupFailed, token],
  );

  useDebouncedGridflowRealtimeHandler(
    useCallback((event) => {
      if (
        event.kind !== GridflowRealtimeEventKind.QUEUE_MEMBERSHIP &&
        event.kind !== GridflowRealtimeEventKind.STATION_QUEUE &&
        event.kind !== GridflowRealtimeEventKind.STATION_ALLOCATION
      ) {
        return;
      }

      void load({ showLoading: false });
    }, [load]),
  );

  useGridflowRealtimeReconnectSnapshot(
    useCallback(() => {
      void load({ showLoading: false });
    }, [load]),
  );

  useEffect(() => {
    void load({ showLoading: !seedMembership });
  }, [load, seedMembership]);

  useFocusEffect(
    useCallback(() => {
      void load({ showLoading: false });
    }, [load]),
  );

  useEffect(() => {
    return subscribeQueueMembershipRefresh(() => {
      void load({ showLoading: false });
    });
  }, [load]);

  useEffect(() => {
    if (!refreshOnAppForeground) {
      return undefined;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void load({ showLoading: false });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [load, refreshOnAppForeground]);

  return {
    membership,
    stationName,
    isLoading,
    isRefreshing,
    error,
    refresh: load,
  };
}
