import type { ConnectorType } from '@/types/vehicle';

export const CHARGING_PREFERENCES = ['ANY', 'FAST'] as const;

export type ChargingPreference = (typeof CHARGING_PREFERENCES)[number];

export type StationQueueSummary = {
  id: string;
  status: 'ACTIVE';
};

export const QUEUE_MEMBER_STATES = [
  'QUEUED',
  'APPROACHING',
  'READY',
  'GRACE',
  'HOLD',
  'CHARGING',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'EXPIRED',
] as const;

export type QueueMemberState = (typeof QUEUE_MEMBER_STATES)[number];

/** States that mean the driver still has an active place in a station queue. */
export const ACTIVE_QUEUE_MEMBER_STATES: readonly QueueMemberState[] = [
  'QUEUED',
  'APPROACHING',
  'READY',
  'GRACE',
  'HOLD',
  'CHARGING',
];

export type JoinQueueRequest = {
  vehicleId?: string;
  connectorPreference?: ConnectorType;
  chargingPreference: ChargingPreference;
};

export type QueueMemberAllocationSummary = {
  id: string;
  evseId: string;
  status: string;
  allocatedAt: string;
} | null;

export type QueueMember = {
  id: string;
  queueId: string;
  stationId: string;
  driverUserId: string;
  vehicleId?: string | null;
  connectorPreference?: ConnectorType | null;
  chargingPreference: ChargingPreference;
  position: number;
  state: QueueMemberState;
  joinedAt: string;
  estimatedTurnAt?: string | null;
  arrivalWindowStart?: string | null;
  arrivalWindowEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  allocation?: QueueMemberAllocationSummary;
};

export function isActiveQueueMemberState(state: string): state is QueueMemberState {
  return (ACTIVE_QUEUE_MEMBER_STATES as readonly string[]).includes(state);
}

export function formatQueueMemberState(state: string): string {
  switch (state) {
    case 'QUEUED':
      return 'Queued';
    case 'APPROACHING':
      return 'Approaching';
    case 'READY':
      return 'Ready';
    case 'GRACE':
      return 'Grace period';
    case 'HOLD':
      return 'On hold';
    case 'CHARGING':
      return 'Charging';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No show';
    case 'EXPIRED':
      return 'Expired';
    default:
      return state;
  }
}
