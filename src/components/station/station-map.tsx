import type { Station } from '@/types/station';
import type { Coordinates } from '@/utils/geolocation';

export type StationMapProps = {
  stations: Station[];
  variant?: 'embedded' | 'fullscreen';
  /** Changes when search/filters/results change — triggers a one-time camera fit. */
  cameraFitKey?: string;
  /**
   * When true (e.g. distance / radius filter), zoom to the nearest station instead of
   * fitting the full result bounds.
   */
  focusClosestStation?: boolean;
  userCoords?: Coordinates | null;
  onRequestUserLocation?: () => void;
};

export { StationMap } from './station-map.web';
