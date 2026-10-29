import type { Station } from '@/types/station';
import { hasMetricValue } from '@/utils/charging-session-format';

type StationLocationFields = Pick<
  Station,
  'city' | 'regionCity' | 'state' | 'formattedAddress' | 'distanceKm'
>;

/** Compact subtitle for Home journey card (e.g. "Johar Town · Lahore"). */
export function formatStationDiscoverySubtitle(
  station: StationLocationFields | null | undefined,
): string | null {
  if (!station) {
    return null;
  }

  const region = station.regionCity?.trim();
  const city = station.city?.trim();

  if (region && city && region.toLowerCase() !== city.toLowerCase()) {
    return `${region} · ${city}`;
  }

  if (region && city) {
    return `${region} · ${city}`;
  }

  if (city && station.state?.trim()) {
    return `${city} · ${station.state.trim()}`;
  }

  if (station.formattedAddress?.trim()) {
    const segments = station.formattedAddress
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      return `${segments[0]} · ${segments[1]}`;
    }

    return segments[0] ?? null;
  }

  return city || region || station.state?.trim() || null;
}

/** Home journey subtitle with optional distance (e.g. "Johar Town · 2.4 km"). */
export function formatHomeJourneyStationSubtitle(
  station: StationLocationFields | null | undefined,
): string | null {
  const base = formatStationDiscoverySubtitle(station);
  const km = station?.distanceKm;

  if (!hasMetricValue(km)) {
    return base;
  }

  const distance = `${Number(km).toFixed(1)} km`;

  if (!base) {
    return distance;
  }

  const region = station?.regionCity?.trim();
  const city = station?.city?.trim();

  if (region) {
    return `${region} · ${distance}`;
  }

  if (city) {
    return `${city} · ${distance}`;
  }

  return `${base} · ${distance}`;
}
