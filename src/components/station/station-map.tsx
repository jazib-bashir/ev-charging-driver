import type { Station } from '@/types/station';

export type StationMapProps = {
  stations: Station[];
  variant?: 'embedded' | 'fullscreen';
};

export { StationMap } from './station-map.web';
