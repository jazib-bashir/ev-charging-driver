import type { Station } from '@/types/station';

import { formatCurrencyAmount } from './charging-session-format';

export function hasValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export function formatText(value: string | number | null | undefined): string {
  if (!hasValue(value)) return 'N/A';
  return String(value);
}

export function formatCompact(value: string | number | null | undefined): string {
  if (!hasValue(value)) return '-';
  return String(value);
}

export function getStationAddress(station: Station): string {
  return station.formattedAddress ?? station.fullAddress ?? station.regionCity ?? '';
}

export function shouldShowStationCity(station: Station, address: string): boolean {
  if (!hasValue(station.city)) {
    return false;
  }

  const city = String(station.city).trim().toLowerCase();
  return !address.toLowerCase().includes(city);
}

export function formatConnectorTypeLabel(type: string): string {
  const normalized = type.trim();

  if (normalized === 'Type2') {
    return 'Type 2';
  }

  if (normalized === 'Type1') {
    return 'Type 1';
  }

  return normalized;
}

export function getStationStatus(station: Station): {
  label: string;
  variant: 'available' | 'unavailable' | 'neutral';
} {
  if (hasValue(station.statusLabel)) {
    const label = String(station.statusLabel);
    const lower = label.toLowerCase();
    if (lower.includes('available')) return { label, variant: 'available' };
    if (
      lower.includes('offline') ||
      lower.includes('out of service') ||
      lower.includes('unavailable') ||
      lower.includes('use') ||
      lower.includes('setup') ||
      lower.includes('progress')
    ) {
      return { label, variant: 'unavailable' };
    }
    return { label, variant: 'neutral' };
  }

  if (station.setupStatus === 'completed') {
    return { label: 'Available', variant: 'available' };
  }

  if (station.setupStatus === 'in_progress') {
    const estimate = hasValue(station.statusEstimate)
      ? ` (Est. ${station.statusEstimate})`
      : '';
    return { label: `In Setup${estimate}`, variant: 'unavailable' };
  }

  if (hasValue(station.setupStatus)) {
    return { label: formatText(station.setupStatus), variant: 'neutral' };
  }

  return { label: 'N/A', variant: 'neutral' };
}

export function formatDistanceKm(distanceKm: number | null | undefined): string {
  if (!hasValue(distanceKm)) return 'N/A';

  const value = Number(distanceKm);
  if (value < 1) {
    return `${Math.max(1, Math.round(value * 1000))} m`;
  }

  return `${value.toFixed(1)} km`;
}

/** @deprecated Use formatDistanceKm */
export function formatDistance(distanceMi: number | null | undefined): string {
  if (!hasValue(distanceMi)) return 'N/A';
  return `${distanceMi} mi`;
}

export function formatPower(maxPowerKw: number | null | undefined): string {
  if (!hasValue(maxPowerKw)) return 'N/A';
  return `${maxPowerKw} kW`;
}

export function formatPricePerKwh(
  price: number | null | undefined,
  currencyCode?: string | null,
): string {
  if (price === null || price === undefined) return 'N/A';
  return `${formatCurrencyAmount(price, currencyCode)}/kWh`;
}

export function hasChargerCount(chargerCount: number | null | undefined): boolean {
  return chargerCount !== null && chargerCount !== undefined && chargerCount > 0;
}

/** True when the value is a finite number, including zero. */
export function hasEvseCount(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function formatBayAvailability(station: Station): string | null {
  const total = station.totalEvses;
  const available = station.availableEvses;

  if (!hasEvseCount(total) || !hasEvseCount(available)) {
    return null;
  }

  return `${available}/${total} Available`;
}

/** Station card / compact bay free display. Never falls back to charger counts. */
export function formatBaysFree(station: Station): string {
  const total = station.totalEvses;
  const available = station.availableEvses;

  if (!hasEvseCount(total) || !hasEvseCount(available)) {
    return '—';
  }

  if (Number(total) === 0) {
    return '0';
  }

  return `${available}/${total}`;
}

/**
 * Bay fill level for map markers.
 * - unknown: missing counts or total is 0
 * - empty: no available EVSEs
 * - limited: available/total <= 25%
 * - plentiful: more than 25% available
 */
export function getBayFillLevel(
  total: number | null | undefined,
  available: number | null | undefined,
): 'unknown' | 'empty' | 'limited' | 'plentiful' {
  if (!hasEvseCount(total) || !hasEvseCount(available) || Number(total) <= 0) {
    return 'unknown';
  }

  const freeCount = Number(available);
  if (freeCount <= 0) {
    return 'empty';
  }

  if (freeCount / Number(total) <= 0.25) {
    return 'limited';
  }

  return 'plentiful';
}

export type StationFilters = {
  fast: boolean;
  available: boolean;
  queue: boolean;
  /** True when the quick chip radius (< 3 km) is active. */
  distance: boolean;
  tesla: boolean;
  ccs: boolean;
};

/** Radius used by the Home/Map “< 3 km” quick chip. */
export const QUICK_DISTANCE_RADIUS_KM = 3;

export function stationMatchesAvailableFilter(station: Station): boolean {
  if (getStationStatus(station).variant === 'available') {
    return true;
  }

  return hasEvseCount(station.availableEvses) && Number(station.availableEvses) > 0;
}

export function stationMatchesQueueOpenFilter(station: Station): boolean {
  return station.queue != null && station.queue.status === 'ACTIVE';
}

export function matchesSearch(station: Station, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const fields = [
    station.name,
    station.formattedAddress,
    station.fullAddress,
    station.regionCity,
    station.city,
    station.state,
    station.country,
  ];

  return fields.some((field) => field?.toLowerCase().includes(normalized));
}
