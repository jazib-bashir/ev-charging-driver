import { useLocalSearchParams } from 'expo-router';

import { StationDetailsScreen } from '@/components/station/station-details-screen';

export default function StationDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stationId = Array.isArray(id) ? id[0] : id;

  return <StationDetailsScreen stationId={stationId ?? ''} />;
}
