import type { WhoAmIResponse } from '@/api/auth';
import { mapChargingSession } from '@/api/chargingSessions';
import { mapQueueMember } from '@/api/stationQueue';
import type { ChargingSession } from '@/types/charging-session';
import type { QueueMember } from '@/types/queue';

export type ParsedWhoAmIActiveJourney = {
  chargingSession: ChargingSession | null;
  chargingStationName?: string;
  queueMembership: QueueMember | null;
  queueStationName?: string;
  queueMemberChargingWithoutSession?: boolean;
};

export function buildAuthJourneySeedKey(
  user: WhoAmIResponse | null | undefined,
): string | null {
  if (!user || user.activeJourneyLookup !== 'ok') {
    return null;
  }

  const journey = user.activeJourney;

  if (!journey) {
    return 'none';
  }

  if (journey.kind === 'CHARGING') {
    return `charging:${String(journey.session.id ?? '')}`;
  }

  return `queued:${String(journey.membership.id ?? '')}`;
}

export function parseWhoAmIActiveJourney(
  user: WhoAmIResponse | null | undefined,
): ParsedWhoAmIActiveJourney | null {
  if (!user || user.activeJourneyLookup === 'failed') {
    return null;
  }

  const journey = user.activeJourney;

  if (!journey) {
    return {
      chargingSession: null,
      queueMembership: null,
    };
  }

  if (journey.kind === 'CHARGING') {
    return {
      chargingSession: mapChargingSession(journey.session),
      chargingStationName:
        typeof journey.stationName === 'string' ? journey.stationName : undefined,
      queueMembership: null,
    };
  }

  return {
    chargingSession: null,
    queueMembership: mapQueueMember(journey.membership),
    queueStationName:
      typeof journey.stationName === 'string' ? journey.stationName : undefined,
    queueMemberChargingWithoutSession:
      journey.queueMemberChargingWithoutSession === true,
  };
}
