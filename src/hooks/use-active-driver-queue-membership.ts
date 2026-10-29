import { useCallback, useEffect, useRef, useState } from 'react';

import { listDriverQueueMembers } from '@/api/stationQueue';
import { fetchPublicStation } from '@/api/publicStations';
import { AuthApiError } from '@/api/auth';
import type { QueueMember } from '@/types/queue';
import type { Station } from '@/types/station';
import { subscribeQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import { selectPrimaryActiveQueueMembership } from '@/utils/select-primary-queue-membership';
import {
  useDebouncedGridflowRealtimeHandler,
  useGridflowRealtimeReconnectSnapshot,
  useGridflowRealtimeStation,
} from '@/realtime/gridflow-realtime-provider';
import { GridflowRealtimeEventKind } from '@/realtime/gridflow-realtime-types';

type JourneyStationMeta = Pick<
  Station,
  'id' | 'name' | 'city' | 'regionCity' | 'state' | 'formattedAddress' | 'distanceKm'
>;

type UseActiveDriverQueueMembershipOptions = {
  token: string | null;
  seedMembership?: QueueMember | null;
  seedStationName?: string;
  journeyLookupFailed?: boolean;
  authJourneySeedKey?: string | null;
};

const REALTIME_DEBOUNCE_MS = 800;

function toJourneyStationMeta(station: Station | null | undefined): JourneyStationMeta | null {
  if (!station) {
    return null;
  }

  return {
    id: station.id,
    name: station.name,
    city: station.city,
    regionCity: station.regionCity,
    state: station.state,
    formattedAddress: station.formattedAddress,
    distanceKm: station.distanceKm,
  };
}

export function useActiveDriverQueueMembership({
  token,
  seedMembership,
  seedStationName,
  journeyLookupFailed = false,
  authJourneySeedKey,
}: UseActiveDriverQueueMembershipOptions) {
  const [membership, setMembership] = useState<QueueMember | null>(seedMembership ?? null);
  const [stationName, setStationName] = useState<string | undefined>(seedStationName);
  const [stationMeta, setStationMeta] = useState<JourneyStationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef(0);
  const appliedSeedKeyRef = useRef<string | null>(null);
  const stationMetaIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const loadRef = useRef<(options?: { showLoading?: boolean }) => Promise<void>>(async () => undefined);

  useGridflowRealtimeStation(membership?.stationId);

  useEffect(() => {
    stationMetaIdRef.current = stationMeta?.id ?? null;
  }, [stationMeta?.id]);

  useEffect(() => {
    if (journeyLookupFailed || authJourneySeedKey == null) {
      return;
    }

    if (appliedSeedKeyRef.current === authJourneySeedKey) {
      return;
    }
    appliedSeedKeyRef.current = authJourneySeedKey;

    if (seedMembership) {
      setMembership(seedMembership);
      setStationName(seedStationName);
      return;
    }

    setMembership(null);
    setStationName(undefined);
    setStationMeta(null);
    stationMetaIdRef.current = null;
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
        setStationMeta(null);
        stationMetaIdRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
        inFlightRef.current = false;
        return;
      }

      if (inFlightRef.current) {
        return;
      }

      const showLoading = options?.showLoading ?? true;
      inFlightRef.current = true;
      const requestId = ++loadRequestRef.current;

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
          setStationMeta(null);
          stationMetaIdRef.current = null;
          return;
        }

        const stationId = primary.stationId?.trim();
        if (!stationId) {
          setStationName(undefined);
          setStationMeta(null);
          stationMetaIdRef.current = null;
          return;
        }

        if (stationMetaIdRef.current === stationId) {
          return;
        }

        try {
          const station = await fetchPublicStation(stationId);

          if (requestId !== loadRequestRef.current) {
            return;
          }

          setStationName(station?.name);
          const meta = toJourneyStationMeta(station);
          setStationMeta(meta);
          stationMetaIdRef.current = meta?.id ?? null;
        } catch {
          if (requestId !== loadRequestRef.current) {
            return;
          }

          setStationName(undefined);
          setStationMeta(null);
          stationMetaIdRef.current = null;
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
          setStationMeta(null);
          stationMetaIdRef.current = null;
        }
      } finally {
        if (requestId === loadRequestRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          inFlightRef.current = false;
        }
      }
    },
    [journeyLookupFailed, token],
  );

  loadRef.current = load;

  useDebouncedGridflowRealtimeHandler(
    useCallback((event) => {
      if (
        event.kind !== GridflowRealtimeEventKind.QUEUE_MEMBERSHIP &&
        event.kind !== GridflowRealtimeEventKind.STATION_QUEUE &&
        event.kind !== GridflowRealtimeEventKind.STATION_ALLOCATION
      ) {
        return;
      }

      void loadRef.current({ showLoading: false });
    }, []),
    REALTIME_DEBOUNCE_MS,
  );

  useGridflowRealtimeReconnectSnapshot(
    useCallback(() => {
      void loadRef.current({ showLoading: false });
    }, []),
  );

  useEffect(() => {
    if (!token) {
      appliedSeedKeyRef.current = null;
      setMembership(null);
      setStationName(undefined);
      setStationMeta(null);
      stationMetaIdRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      inFlightRef.current = false;
      return;
    }

    void load({ showLoading: true });
  }, [authJourneySeedKey, load, token]);

  useEffect(() => {
    return subscribeQueueMembershipRefresh(() => {
      void loadRef.current({ showLoading: false });
    });
  }, []);

  return {
    membership,
    stationName,
    stationMeta,
    isLoading,
    isRefreshing,
    error,
    refresh: load,
  };
}
