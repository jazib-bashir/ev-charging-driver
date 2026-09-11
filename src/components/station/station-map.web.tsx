import { EmptyState } from '@/components/ui/empty-state';
import type { Station } from '@/types/station';

type StationMapProps = {
  stations: Station[];
};

export function StationMap(_props: StationMapProps) {
  return (
    <EmptyState
      title="Map view"
      message="Open this app on iOS or Android to use the station map."
    />
  );
}
