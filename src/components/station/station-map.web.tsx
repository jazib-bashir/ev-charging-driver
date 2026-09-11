import { EmptyState } from '@/components/ui/empty-state';
import type { StationMapProps } from './station-map';

export function StationMap(_props: StationMapProps) {
  return (
    <EmptyState
      title="Map view"
      message="Open this app on iOS or Android to use the station map."
    />
  );
}
