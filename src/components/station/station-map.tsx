import type { Station } from '@/types/station';
import type { Coordinates } from '@/utils/geolocation';

export type StationMapProps = {
  stations: Station[];
  variant?: 'embedded' | 'fullscreen';
  /** Changes when search/filters/results change — triggers a one-time camera fit. */
  cameraFitKey?: string;
  userCoords?: Coordinates | null;
  onRequestUserLocation?: () => void;
};

export { StationMap } from './station-map.web';
