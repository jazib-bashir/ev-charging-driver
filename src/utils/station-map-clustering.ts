import type { Station } from '@/types/station';

export type StationMapCluster = {
  id: string;
  count: number;
  latitude: number;
  longitude: number;
  stations: Station[];
};

export type StationMapPoint =
  | { kind: 'station'; station: Station }
  | { kind: 'cluster'; cluster: StationMapCluster };

/** Only cluster when the camera is clearly zoomed out past a city neighborhood. */
const CLUSTER_ZOOM_DELTA = 0.22;

/**
 * Lightweight grid clustering for map calmness at lower zoom.
 * Selected station is always kept as an individual marker.
 */
export function buildStationMapPoints(
  stations: Station[],
  latitudeDelta: number,
  selectedStationId: string | null,
): StationMapPoint[] {
  const selected = selectedStationId
    ? stations.find((station) => station.id === selectedStationId)
    : null;

  const remainder = selected
    ? stations.filter((station) => station.id !== selected.id)
    : stations;

  // Typical station-fit zoom (~0.08+) should still show individual markers.
  if (latitudeDelta < CLUSTER_ZOOM_DELTA || remainder.length <= 1) {
    return stations.map((station) => ({ kind: 'station', station }));
  }

  const cellSize = Math.max(latitudeDelta / 5, 0.02);
  const buckets = new Map<string, Station[]>();

  for (const station of remainder) {
    const lat = station.latitude!;
    const lng = station.longitude!;
    const row = Math.floor(lat / cellSize);
    const col = Math.floor(lng / cellSize);
    const key = `${row}:${col}`;
    const list = buckets.get(key);
    if (list) {
      list.push(station);
    } else {
      buckets.set(key, [station]);
    }
  }

  const points: StationMapPoint[] = [];

  if (selected) {
    points.push({ kind: 'station', station: selected });
  }

  for (const [key, group] of buckets) {
    if (group.length === 1) {
      points.push({ kind: 'station', station: group[0] });
      continue;
    }

    // Keep small nearby pairs selectable instead of forcing a cluster.
    if (group.length === 2) {
      points.push({ kind: 'station', station: group[0] });
      points.push({ kind: 'station', station: group[1] });
      continue;
    }

    const latitude =
      group.reduce((sum, station) => sum + (station.latitude ?? 0), 0) / group.length;
    const longitude =
      group.reduce((sum, station) => sum + (station.longitude ?? 0), 0) / group.length;

    points.push({
      kind: 'cluster',
      cluster: {
        id: `cluster-${key}`,
        count: group.length,
        latitude,
        longitude,
        stations: group,
      },
    });
  }

  return points;
}
