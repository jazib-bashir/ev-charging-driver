import type { Station } from '@/types/station';

type StationLocationFields = Pick<
  Station,
  'city' | 'regionCity' | 'state' | 'formattedAddress'
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
