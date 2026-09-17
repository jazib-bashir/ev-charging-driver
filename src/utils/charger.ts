import type { Charger } from '@/types/charger';

import { formatCurrencyRate } from './charging-session-format';
import { formatConnectorTypeLabel, formatText, hasValue } from './station';

export type ChargerStatus = {
  label: string;
  variant: 'available' | 'unavailable' | 'neutral';
  isSelectable: boolean;
};

export type ChargerGroup = {
  key: string;
  label: string;
  powerKw: number | null;
  chargers: Charger[];
};

export function getChargerDisplayName(charger: Charger): string {
  if (hasValue(charger.name)) {
    return String(charger.name);
  }

  return formatText(charger.serialNumber);
}

export function getChargerListTitle(charger: Charger): string {
  const name = getChargerDisplayName(charger);
  const separatorIndex = name.lastIndexOf(' - ');

  if (separatorIndex > 0) {
    return name.slice(0, separatorIndex).trim();
  }

  return name;
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

export function getChargerHardwareSummary(charger: Charger): string {
  return [charger.manufacturer, charger.model].filter(hasValue).join(' · ');
}

export function getChargerListMeta(charger: Charger): string | null {
  const parts: string[] = [];
  const connectors = getChargerConnectorSummary(charger);

  if (connectors) {
    parts.push(connectors);
  }

  const hardware = getChargerHardwareSummary(charger);
  if (hardware) {
    parts.push(hardware);
  }

  if (hasValue(charger.maxPowerKw)) {
    parts.push(formatChargerPower(charger.maxPowerKw));
  }

  return parts.length > 0 ? parts.join(' · ') : null;
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

export function getChargerGroupKey(charger: Charger): string {
  const type = charger.chargerType?.trim().toUpperCase() ?? 'unknown';
  const fast = charger.isFastCharger ? 'fast' : 'standard';
  return `${type}-${fast}`;
}

export function getGroupPowerKw(chargers: Charger[]): number | null {
  const values = chargers
    .map((charger) => charger.maxPowerKw)
    .filter((value): value is number => hasValue(value));

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

export function groupChargersByType(chargers: Charger[]): ChargerGroup[] {
  const groups = new Map<string, ChargerGroup>();

  chargers.forEach((charger) => {
    const key = getChargerGroupKey(charger);
    const existing = groups.get(key);

    if (existing) {
      existing.chargers.push(charger);
      return;
    }

    groups.set(key, {
      key,
      label: getChargerTypeLabel(charger),
      powerKw: null,
      chargers: [charger],
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    powerKw: getGroupPowerKw(group.chargers),
  }));
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

export function formatChargerEstimate(charger: Charger): string | null {
  if (!hasValue(charger.statusEstimate)) {
    return null;
  }

  return `Est. ${charger.statusEstimate}`;
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
