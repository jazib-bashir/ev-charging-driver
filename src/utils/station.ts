import type { Station } from '@/types/station';

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

export function formatDistance(distanceMi: number | null | undefined): string {
  if (!hasValue(distanceMi)) return 'N/A';
  return `${distanceMi} mi`;
}

export function formatPower(maxPowerKw: number | null | undefined): string {
  if (!hasValue(maxPowerKw)) return 'N/A';
  return `${maxPowerKw} kW`;
}

export function formatPricePerKwh(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'N/A';
  return `$${price.toFixed(2)}/kWh`;
}

export function hasChargerCount(chargerCount: number | null | undefined): boolean {
  return chargerCount !== null && chargerCount !== undefined && chargerCount > 0;
}

export function formatChargerAvailability(station: Station): string | null {
  const total = station.chargerCount;
  const available = station.availableChargers;

  if (!hasChargerCount(total)) {
    return null;
  }

  if (hasValue(available)) {
    return `${available} / ${total} Open`;
  }

  const count = Number(total);
  return count === 1 ? '1 Charger' : `${count} Chargers`;
}

export type StationFilters = {
  fast: boolean;
  tesla: boolean;
  ccs: boolean;
};

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
