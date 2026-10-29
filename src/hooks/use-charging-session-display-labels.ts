import { useEffect, useState } from 'react';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import type { ChargingSession } from '@/types/charging-session';
import type { Station } from '@/types/station';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';
import { formatHomeJourneyConnectorLabel } from '@/utils/charging-session-format';

type JourneyStationMeta = Pick<
  Station,
  'id' | 'name' | 'city' | 'regionCity' | 'state' | 'formattedAddress' | 'distanceKm'
>;

export function useChargingSessionDisplayLabels(session: ChargingSession | null) {
  const [stationName, setStationName] = useState<string>();
  const [stationMeta, setStationMeta] = useState<JourneyStationMeta | null>(null);
  const [evseLabel, setEvseLabel] = useState<string>();
  const [connectorLabel, setConnectorLabel] = useState<string>();

  useEffect(() => {
    if (!session) {
      setStationName(undefined);
      setStationMeta(null);
      setEvseLabel(undefined);
      setConnectorLabel(undefined);
      return;
    }

    setStationName(session.stationName ?? undefined);
    setEvseLabel(session.evseLabel ?? undefined);
    const seededConnector = formatHomeJourneyConnectorLabel(session.connectorLabel);
    setConnectorLabel(seededConnector !== '—' ? seededConnector : undefined);

    const stationId = session.stationId?.trim();
    if (!stationId) {
      setStationMeta(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [station, chargers] = await Promise.all([
          fetchPublicStation(stationId),
          fetchPublicChargers({ stationId }),
        ]);

        if (cancelled) {
          return;
        }

        const charger = chargers.data.find((item) => item.id === session.chargerId);
        const connector = charger?.connectors?.find(
          (item) => item.id === session.connectorId,
        );

        setStationName(station?.name ?? session.stationName ?? undefined);
        setStationMeta(
          station
            ? {
                id: station.id,
                name: station.name,
                city: station.city,
                regionCity: station.regionCity,
                state: station.state,
                formattedAddress: station.formattedAddress,
                distanceKm: station.distanceKm,
              }
            : null,
        );
        setEvseLabel(
          formatEvseLabel(session.evseLabel, charger?.name, session.evseId),
        );
        setConnectorLabel(
          formatConnectorLabel(connector, session.connectorLabel ?? session.connectorId),
        );
      } catch {
        if (!cancelled) {
          setStationName(session.stationName ?? undefined);
          setStationMeta(null);
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

  return { stationName, stationMeta, evseLabel, connectorLabel };
}
