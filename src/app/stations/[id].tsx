import { useLocalSearchParams } from 'expo-router';

import { StationDetailsScreen } from '@/components/station/station-details-screen';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function StationDetailsRoute() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    resumeChargerId?: string | string[];
    resumeBooking?: string | string[];
  }>();

  const stationId = firstParam(params.id) ?? '';
  const resumeChargerId = firstParam(params.resumeChargerId);
  const resumeBooking = firstParam(params.resumeBooking) === '1';

  return (
    <StationDetailsScreen
      stationId={stationId}
      resumeChargerId={resumeChargerId}
      resumeBooking={resumeBooking}
    />
  );
}
