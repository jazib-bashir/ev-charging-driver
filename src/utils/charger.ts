import type { Charger } from '@/types/charger';

import { formatText, hasValue } from './station';

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
  if (hasValue(charger.serialNumber)) {
    return String(charger.serialNumber);
  }

  return formatText(charger.name);
}

export function getChargerStatus(charger: Charger): ChargerStatus {
  if (hasValue(charger.statusLabel)) {
    const label = String(charger.statusLabel);
    const lower = label.toLowerCase();

    if (lower.includes('available')) {
      return { label, variant: 'available', isSelectable: true };
    }

    if (lower.includes('use') || lower.includes('setup') || lower.includes('progress')) {
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

export function formatDetailPricePerKwh(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return '-';
  }

  return `$${price.toFixed(2)} / kWh`;
}
