import type { Charger } from '@/types/charger';

import { formatCurrencyRate } from './charging-session-format';
import { formatConnectorTypeLabel, formatText, hasValue } from './station';

export type ChargerStatus = {
  label: string;
  variant: 'available' | 'unavailable' | 'neutral';
  isSelectable: boolean;
};

export function getChargerDisplayName(charger: Charger): string {
  if (hasValue(charger.name)) {
    return String(charger.name);
  }

  return formatText(charger.serialNumber);
}

export function getChargerEffectivePrice(
  charger: Charger,
  stationDefaultPricePerKwh?: number | null,
): number | null {
  const price =
    charger.effectivePricePerKwh ?? charger.pricePerKwh ?? stationDefaultPricePerKwh ?? null;

  return price ?? null;
}

export function getChargerConnectorSummary(charger: Charger): string {
  const labels = [
    ...new Set(
      charger.connectors
        ?.map((connector) => formatConnectorTypeLabel(connector.connectorType))
        .filter(hasValue) ?? [],
    ),
  ];

  return labels.join(' · ');
}

function statusFromOperationalValue(
  status: string,
  label?: string | null,
): ChargerStatus | null {
  const normalized = status.trim().toUpperCase();

  if (normalized === 'AVAILABLE') {
    return {
      label: label ?? 'Available',
      variant: 'available',
      isSelectable: true,
    };
  }

  if (normalized === 'CHARGING') {
    return {
      label: label ?? 'In Use',
      variant: 'unavailable',
      isSelectable: false,
    };
  }

  if (normalized === 'OFFLINE') {
    return {
      label: label ?? 'Offline',
      variant: 'unavailable',
      isSelectable: false,
    };
  }

  if (normalized === 'OUT_OF_SERVICE') {
    return {
      label: label ?? 'Out of Service',
      variant: 'unavailable',
      isSelectable: false,
    };
  }

  return null;
}

export function getChargerStatus(charger: Charger): ChargerStatus {
  if (hasValue(charger.status)) {
    const operationalStatus = statusFromOperationalValue(
      String(charger.status),
      charger.statusLabel,
    );

    if (operationalStatus) {
      return operationalStatus;
    }
  }

  if (hasValue(charger.statusLabel)) {
    const label = String(charger.statusLabel);
    const lower = label.toLowerCase();

    if (lower.includes('available')) {
      return { label, variant: 'available', isSelectable: true };
    }

    if (
      lower.includes('offline') ||
      lower.includes('out of service') ||
      lower.includes('use') ||
      lower.includes('setup') ||
      lower.includes('progress')
    ) {
      return { label, variant: 'unavailable', isSelectable: false };
    }

    return { label, variant: 'neutral', isSelectable: false };
  }

  if (charger.setupStatus === 'completed') {
    return { label: 'Available', variant: 'available', isSelectable: true };
  }

  if (charger.setupStatus === 'in_progress') {
    const estimate = hasValue(charger.statusEstimate)
      ? ` (Est. ${charger.statusEstimate})`
      : '';
    return { label: `In Setup${estimate}`, variant: 'unavailable', isSelectable: false };
  }

  if (hasValue(charger.setupStatus)) {
    return {
      label: formatText(charger.setupStatus),
      variant: 'neutral',
      isSelectable: false,
    };
  }

  return { label: 'N/A', variant: 'neutral', isSelectable: false };
}

export function getChargerTypeLabel(charger: Charger): string {
  const type = charger.chargerType?.trim().toUpperCase();

  if (charger.isFastCharger && type === 'DC') {
    return 'DC Fast';
  }

  if (type === 'DC') {
    return 'DC';
  }

  if (type === 'AC') {
    return 'Level 2';
  }

  if (hasValue(charger.chargerType)) {
    return String(charger.chargerType);
  }

  return 'N/A';
}

export function formatChargerPower(maxPowerKw: number | null | undefined): string {
  if (!hasValue(maxPowerKw)) {
    return '-';
  }

  return `${maxPowerKw} kW`;
}

export function formatChargerIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function formatDetailDistance(distanceMi: number | null | undefined): string {
  if (!hasValue(distanceMi)) {
    return '-';
  }

  return String(distanceMi);
}

export function formatDetailPricePerKwh(
  price: number | null | undefined,
  currencyCode?: string | null,
): string {
  if (price === null || price === undefined) {
    return '-';
  }

  return formatCurrencyRate(price, currencyCode);
}

export type StationEvseBay = {
  evseId: string;
  label: string;
  status?: string | null;
  statusLabel?: string | null;
  connectors: Charger['connectors'];
  maxPowerKw: number | null;
  chargerId: string;
  chargerName: string;
  charger: Charger;
};

/**
 * Flatten nested charger.evses into bay cards.
 * Preserves charger order; sorts EVSEs by label within each charger.
 * Does not invent EVSEs from connectors or charger counts.
 */
export function flattenStationEvseBays(chargers: Charger[]): StationEvseBay[] {
  const bays: StationEvseBay[] = [];

  for (const charger of chargers) {
    if (!Array.isArray(charger.evses)) {
      continue;
    }

    const evses = [...charger.evses].sort((left, right) =>
      String(left.label ?? '').localeCompare(String(right.label ?? ''), undefined, {
        numeric: true,
      }),
    );

    for (const evse of evses) {
      const evseId = evse.id?.trim();
      if (!evseId) {
        continue;
      }

      bays.push({
        evseId,
        label: evse.label?.trim() || evseId.slice(-4),
        status: evse.status,
        statusLabel: evse.statusLabel,
        connectors: evse.connectors ?? [],
        maxPowerKw: charger.maxPowerKw ?? null,
        chargerId: charger.id,
        chargerName: getChargerDisplayName(charger),
        charger,
      });
    }
  }

  return bays;
}

export function getEvseBayStatus(bay: StationEvseBay): ChargerStatus {
  if (hasValue(bay.status)) {
    const operationalStatus = statusFromOperationalValue(
      String(bay.status),
      bay.statusLabel,
    );
    if (operationalStatus) {
      return operationalStatus;
    }
  }

  if (hasValue(bay.statusLabel)) {
    return getChargerStatus({
      id: bay.chargerId,
      name: bay.chargerName,
      statusLabel: bay.statusLabel,
    });
  }

  return { label: 'N/A', variant: 'neutral', isSelectable: false };
}

export function getEvseBayConnectorSummary(bay: StationEvseBay): string {
  return getChargerConnectorSummary({
    id: bay.chargerId,
    name: bay.chargerName,
    connectors: bay.connectors,
  });
}
