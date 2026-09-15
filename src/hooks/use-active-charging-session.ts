import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getActiveDriverChargingSession } from '@/api/chargingSessions';
import { AuthApiError } from '@/api/auth';
import type { ChargingSession } from '@/types/charging-session';

type UseActiveChargingSessionOptions = {
  token: string | null;
  pollIntervalMs?: number;
};

export function useActiveChargingSession({
  token,
  pollIntervalMs = 15_000,
}: UseActiveChargingSessionOptions) {
  const [session, setSession] = useState<ChargingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const activeSession = await getActiveDriverChargingSession(token);
      setSession(activeSession);
    } catch (loadError) {
      const message =
        loadError instanceof AuthApiError
          ? loadError.message
          : 'Failed to load active session';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!token || !session || session.status !== 'CHARGING') {
      return undefined;
    }

    const interval = setInterval(() => {
      void load();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [load, pollIntervalMs, session, token]);

  return {
    session,
    isLoading,
    error,
    refresh: load,
  };
}
