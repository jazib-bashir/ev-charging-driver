import { useEffect, useState } from 'react';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import type { ChargingSession } from '@/types/charging-session';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

export function useChargingSessionDisplayLabels(session: ChargingSession | null) {
  const [stationName, setStationName] = useState<string>();
  const [evseLabel, setEvseLabel] = useState<string>();
  const [connectorLabel, setConnectorLabel] = useState<string>();

  useEffect(() => {
    if (!session) {
      setStationName(undefined);
      setEvseLabel(undefined);
      setConnectorLabel(undefined);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [station, chargers] = await Promise.all([
          fetchPublicStation(session.stationId),
          fetchPublicChargers({ stationId: session.stationId }),
        ]);

        if (cancelled) {
          return;
        }

        const charger = chargers.data.find((item) => item.id === session.chargerId);
        const connector = charger?.connectors?.find(
          (item) => item.id === session.connectorId,
        );

        setStationName(station?.name ?? session.stationName ?? undefined);
        setEvseLabel(
          formatEvseLabel(session.evseLabel, charger?.name, session.evseId),
        );
        setConnectorLabel(formatConnectorLabel(connector, session.connectorId));
      } catch {
        if (!cancelled) {
          setStationName(session.stationName ?? undefined);
          setEvseLabel(session.evseLabel ?? undefined);
          setConnectorLabel(session.connectorLabel ?? undefined);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session?.chargerId,
    session?.connectorId,
    session?.connectorLabel,
    session?.evseId,
    session?.evseLabel,
    session?.id,
    session?.stationId,
    session?.stationName,
  ]);

  return { stationName, evseLabel, connectorLabel };
}
