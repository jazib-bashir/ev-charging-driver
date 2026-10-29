import { useCallback, useEffect, useState } from 'react';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import { getChargingSessionDetail } from '@/api/chargingSessions';
import { AuthApiError } from '@/api/auth';
import type { ChargingSession, ChargingSessionDetail } from '@/types/charging-session';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

type UseChargingSessionDetailOptions = {
  token: string | null;
  sessionId: string;
  fallbackSession?: ChargingSession | null;
};

async function buildFallbackDetail(
  session: ChargingSession,
): Promise<ChargingSessionDetail> {
  const [station, chargersResponse] = await Promise.all([
    fetchPublicStation(session.stationId),
    fetchPublicChargers({ stationId: session.stationId }),
  ]);

  const charger = chargersResponse.data.find((item) => item.id === session.chargerId) ?? null;
  const connector =
    charger?.connectors?.find((item) => item.id === session.connectorId) ?? null;

  const timeline: ChargingSessionDetail['timeline'] = [
    {
      type: 'STARTED',
      status: 'CHARGING',
      at: session.startedAt,
    },
  ];

  if (session.endedAt) {
    timeline.push({
      type: session.status,
      status: session.status,
      at: session.endedAt,
      stopReason: session.stopReason,
      durationSeconds: session.durationSeconds,
    });
  }

  return {
    session,
    station: station
      ? {
          id: station.id,
          name: station.name,
          defaultPricePerKwh: station.defaultPricePerKwh,
        }
      : null,
    charger: charger
      ? {
          id: charger.id,
          name: charger.name,
          maxPowerKw: charger.maxPowerKw,
        }
      : null,
    evse: {
      id: session.evseId,
      label: formatEvseLabel(undefined, charger?.name, session.evseId),
    },
    connector: connector
      ? {
          id: connector.id,
          connectorType: connector.connectorType,
          displayName: formatConnectorLabel(connector, session.connectorId),
          connectorNumber: connector.connectorNumber,
        }
      : null,
    driver: null,
    vehicle: null,
    queueMember: null,
    timeline,
  };
}

export function useChargingSessionDetail({
  token,
  sessionId,
  fallbackSession,
}: UseChargingSessionDetailOptions) {
  const [detail, setDetail] = useState<ChargingSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { showLoading?: boolean }) => {
    if (!token || !sessionId) {
      setDetail(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const showLoading = options?.showLoading ?? true;
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const result = await getChargingSessionDetail(token, sessionId);
      setDetail(result);
    } catch (loadError) {
      if (fallbackSession) {
        try {
          const fallbackDetail = await buildFallbackDetail(fallbackSession);
          setDetail(fallbackDetail);
          return;
        } catch {
          // fall through
        }
      }

      const message =
        loadError instanceof AuthApiError
          ? loadError.message
          : 'Failed to load session details';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fallbackSession, sessionId, token]);

  useEffect(() => {
    void load({ showLoading: true });
  }, [load]);

  const refresh = useCallback(async () => {
    await load({ showLoading: false });
  }, [load]);

  return {
    detail,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
