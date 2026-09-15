import type { Station } from '@/types/station';

export type StationMapProps = {
  stations: Station[];
  variant?: 'embedded' | 'fullscreen';
  /** Changes when search/filters/results change — triggers a one-time camera fit. */
  cameraFitKey?: string;
};

export { StationMap } from './station-map.web';
