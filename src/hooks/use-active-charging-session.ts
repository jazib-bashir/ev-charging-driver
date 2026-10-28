import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { getActiveDriverChargingSession } from '@/api/chargingSessions';
import { AuthApiError } from '@/api/auth';
import type { ChargingSession } from '@/types/charging-session';
import { requestChargingSessionsRefresh } from '@/utils/charging-sessions-refresh';
import { requestQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import { useGridflowRealtimeConnected } from '@/hooks/use-gridflow-realtime-connected';
import {
  useDebouncedGridflowRealtimeHandler,
  useGridflowRealtimeReconnectSnapshot,
} from '@/realtime/gridflow-realtime-provider';
import { GridflowRealtimeEventKind } from '@/realtime/gridflow-realtime-types';

type UseActiveChargingSessionOptions = {
  token: string | null;
  /** Omit or set null to disable interval polling. */
  pollIntervalMs?: number | null;
  /** Poll on an interval even when no session is loaded yet (e.g. queue CHARGING pending session). */
  pollWithoutActiveSession?: boolean;
  /** Refresh when the app returns to the foreground. Default true. */
  refreshOnAppForeground?: boolean;
  /** Initial session from whoAmI when journey lookup succeeded. */
  seedSession?: ChargingSession | null;
  /** When true, whoAmI could not resolve journey; do not clear state on fetch errors. */
  journeyLookupFailed?: boolean;
  /** Changes when auth journey seed should be reapplied. */
  authJourneySeedKey?: string | null;
};

export function useActiveChargingSession({
  token,
  pollIntervalMs = 15_000,
  pollWithoutActiveSession = false,
  refreshOnAppForeground = true,
  seedSession,
  journeyLookupFailed = false,
  authJourneySeedKey,
}: UseActiveChargingSessionOptions) {
  const [session, setSession] = useState<ChargingSession | null>(seedSession ?? null);
  const [isLoading, setIsLoading] = useState(!seedSession);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousSessionIdRef = useRef<string | null>(seedSession?.id ?? null);
  const loadRequestRef = useRef(0);
  const realtimeConnected = useGridflowRealtimeConnected();

  useEffect(() => {
    if (journeyLookupFailed || authJourneySeedKey == null) {
      return;
    }

    if (seedSession) {
      setSession(seedSession);
      previousSessionIdRef.current = seedSession.id;
      setIsLoading(false);
      return;
    }

    setSession(null);
    previousSessionIdRef.current = null;
    setIsLoading(false);
  }, [authJourneySeedKey, journeyLookupFailed, seedSession]);

  const load = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!token) {
        setSession(null);
        setIsLoading(false);
        setIsRefreshing(false);
        previousSessionIdRef.current = null;
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
        const activeSession = await getActiveDriverChargingSession(token);

        if (requestId !== loadRequestRef.current) {
          return;
        }

        const previousId = previousSessionIdRef.current;
        const nextId = activeSession?.id ?? null;

        if (previousId && !nextId) {
          requestChargingSessionsRefresh();
          requestQueueMembershipRefresh();
        }

        previousSessionIdRef.current = nextId;
        setSession(activeSession);
      } catch (loadError) {
        if (requestId !== loadRequestRef.current) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Failed to load active session';
        setError(message);

        if (!journeyLookupFailed) {
          setSession(null);
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
    useCallback(
      (event) => {
        if (
          event.kind !== GridflowRealtimeEventKind.ACTIVE_SESSION &&
          event.kind !== GridflowRealtimeEventKind.QUEUE_MEMBERSHIP
        ) {
          return;
        }

        void load({ showLoading: false });
      },
      [load],
    ),
    300,
  );

  useGridflowRealtimeReconnectSnapshot(
    useCallback(() => {
      void load({ showLoading: false });
    }, [load]),
  );

  useEffect(() => {
    void load({ showLoading: !seedSession });
  }, [load, seedSession]);

  useFocusEffect(
    useCallback(() => {
      void load({ showLoading: false });
    }, [load]),
  );

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const activeCharging = session?.status === 'CHARGING';
    const intervalMs =
      activeCharging && pollIntervalMs == null ? 15_000 : pollIntervalMs;

    if (realtimeConnected) {
      return undefined;
    }

    if (intervalMs == null) {
      return undefined;
    }

    if (!activeCharging && !pollWithoutActiveSession) {
      return undefined;
    }

    const interval = setInterval(() => {
      void load({ showLoading: false });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [load, pollIntervalMs, pollWithoutActiveSession, realtimeConnected, session, token]);

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
    session,
    isLoading,
    isRefreshing,
    error,
    refresh: load,
  };
}
