import { useCallback, useEffect, useRef, useState } from 'react';

import { getActiveDriverChargingSession } from '@/api/chargingSessions';
import { AuthApiError } from '@/api/auth';
import type { ChargingSession } from '@/types/charging-session';
import { requestChargingSessionsRefresh } from '@/utils/charging-sessions-refresh';
import { requestQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import {
  useDebouncedGridflowRealtimeHandler,
  useGridflowRealtimeReconnectSnapshot,
} from '@/realtime/gridflow-realtime-provider';
import { GridflowRealtimeEventKind } from '@/realtime/gridflow-realtime-types';

type UseActiveChargingSessionOptions = {
  token: string | null;
  /** Initial session from whoAmI when journey lookup succeeded. */
  seedSession?: ChargingSession | null;
  /** When true, whoAmI could not resolve journey; do not clear state on fetch errors. */
  journeyLookupFailed?: boolean;
  /** Changes when auth journey seed should be reapplied. */
  authJourneySeedKey?: string | null;
};

const REALTIME_DEBOUNCE_MS = 800;

export function useActiveChargingSession({
  token,
  seedSession,
  journeyLookupFailed = false,
  authJourneySeedKey,
}: UseActiveChargingSessionOptions) {
  const [session, setSession] = useState<ChargingSession | null>(seedSession ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousSessionIdRef = useRef<string | null>(seedSession?.id ?? null);
  const loadRequestRef = useRef(0);
  const appliedSeedKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const loadRef = useRef<(options?: { showLoading?: boolean }) => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (journeyLookupFailed || authJourneySeedKey == null) {
      return;
    }

    if (appliedSeedKeyRef.current === authJourneySeedKey) {
      return;
    }
    appliedSeedKeyRef.current = authJourneySeedKey;

    if (seedSession) {
      setSession(seedSession);
      previousSessionIdRef.current = seedSession.id;
      return;
    }

    setSession(null);
    previousSessionIdRef.current = null;
  }, [authJourneySeedKey, journeyLookupFailed, seedSession]);

  const load = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!token) {
        setSession(null);
        setIsLoading(false);
        setIsRefreshing(false);
        previousSessionIdRef.current = null;
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
          inFlightRef.current = false;
        }
      }
    },
    [journeyLookupFailed, token],
  );

  loadRef.current = load;

  useDebouncedGridflowRealtimeHandler(
    useCallback((event) => {
      if (event.kind !== GridflowRealtimeEventKind.ACTIVE_SESSION) {
        return;
      }

      void loadRef.current({ showLoading: false });
      // Session start/end also changes queue membership; do not wait for a separate
      // queue.membership event (complete/stop historically only published active_session).
      requestQueueMembershipRefresh();
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
      setSession(null);
      previousSessionIdRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      inFlightRef.current = false;
      return;
    }

    void load({ showLoading: true });
  }, [authJourneySeedKey, load, token]);

  return {
    session,
    isLoading,
    isRefreshing,
    error,
    refresh: load,
  };
}
