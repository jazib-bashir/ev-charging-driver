export const CHARGING_SESSION_STATUSES = [
  'CHARGING',
  'COMPLETED',
  'STOPPED',
  'FAILED',
  'CANCELLED',
] as const;

export type ChargingSessionStatus = (typeof CHARGING_SESSION_STATUSES)[number];

/** Status tabs shown on My Sessions (All + these three). */
export const CHARGING_SESSION_STATUS_FILTERS = [
  'CHARGING',
  'COMPLETED',
  'STOPPED',
] as const satisfies readonly ChargingSessionStatus[];

export const CHARGING_SESSION_STOP_REASONS = [
  'OPERATOR_STOP',
  'DRIVER_STOP',
  'OTHER',
] as const;

export type ChargingSessionStopReason = (typeof CHARGING_SESSION_STOP_REASONS)[number];

export type ChargingSession = {
  id: string;
  organizationId: string;
  stationId: string;
  chargerId: string;
  evseId: string;
  connectorId: string;
  driverUserId: string;
  vehicleId: string | null;
  queueMemberId: string | null;
  status: ChargingSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  energyKwh: number | null;
  averagePowerKw: number | null;
  maxPowerKw: number | null;
  pricePerKwh: number | null;
  totalCost: number | null;
  stopReason: ChargingSessionStopReason | null;
  stationName?: string | null;
  chargerName?: string | null;
  evseLabel?: string | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChargingSessionTimelineEvent = {
  type: string;
  status: ChargingSessionStatus;
  at: string;
  stopReason?: ChargingSessionStopReason | null;
  durationSeconds?: number | null;
};

export type ChargingSessionDetail = {
  session: ChargingSession;
  station: Record<string, unknown> | null;
  charger: Record<string, unknown> | null;
  evse: Record<string, unknown> | null;
  connector: Record<string, unknown> | null;
  driver: { id: string; name: string; email?: string } | null;
  vehicle: { id: string; make: string; model: string } | null;
  queueMember: {
    id: string;
    state: string;
    position: number;
    queueId: string;
  } | null;
  timeline: ChargingSessionTimelineEvent[];
};

export type ChargingSessionsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function isActiveChargingSession(session: ChargingSession): boolean {
  return session.status === 'CHARGING';
}

export function formatChargingSessionStatus(status: ChargingSessionStatus): string {
  switch (status) {
    case 'CHARGING':
      return 'Charging';
    case 'COMPLETED':
      return 'Completed';
    case 'STOPPED':
      return 'Stopped';
    case 'FAILED':
      return 'Failed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}
