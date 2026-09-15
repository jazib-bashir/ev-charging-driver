import type { QueueMember, QueueMemberAllocationSummary } from '@/types/queue';

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatEstimatedTurn(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatTime(date);
}

export function formatArrivalWindow(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  if (!startIso || !endIso) {
    return null;
  }

  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function getQueueRank(member: QueueMember): number {
  return member.currentRank ?? member.position;
}

export function getPeopleAhead(member: QueueMember): number {
  return Math.max(0, getQueueRank(member) - 1);
}

export function formatAssignedEvse(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  if (!allocation) {
    return null;
  }

  const evse = allocation.evse;

  if (!evse) {
    return `EVSE ${allocation.evseId.slice(-6)}`;
  }

  const connectorLabel = evse.connectorTypes.join(', ') || '—';
  const powerLabel = evse.maxPowerKw ? `${evse.maxPowerKw} kW` : null;
  const parts = [`EVSE ${evse.label}`, connectorLabel];

  if (powerLabel) {
    parts.push(powerLabel);
  }

  return parts.join(' · ');
}

export function shouldShowQueueTiming(state: string): boolean {
  return state === 'QUEUED';
}

export function shouldShowQueuePosition(state: string): boolean {
  return state === 'QUEUED';
}

export function formatEvseHeadline(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  if (!allocation?.evse) {
    return null;
  }

  return `Head to EVSE ${allocation.evse.label}`;
}

export function formatEvseConnectorPower(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const evse = allocation?.evse;

  if (!evse) {
    return null;
  }

  const connectorLabel = evse.connectorTypes.join(' · ') || null;
  const powerLabel = evse.maxPowerKw ? `${evse.maxPowerKw} kW` : null;

  if (connectorLabel && powerLabel) {
    return `${connectorLabel} · ${powerLabel}`;
  }

  return connectorLabel ?? powerLabel;
}

export function formatEvseBay(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const label = allocation?.evse?.label;

  if (!label) {
    return null;
  }

  return `Bay ${label}`;
}

export function getQueueStatusHeadline(state: string): string {
  switch (state) {
    case 'QUEUED':
      return 'You are in the queue';
    case 'APPROACHING':
      return 'Your turn is now';
    case 'READY':
      return 'Head to your assigned charger';
    case 'GRACE':
      return 'Arrival window passed';
    case 'CHARGING':
      return 'Charging in progress';
    default:
      return "You're in the queue";
  }
}

export function getQueueStatusSubheadline(
  state: string,
  hasAllocation: boolean,
): string {
  switch (state) {
    case 'QUEUED':
      return 'We will update your estimated turn as the queue moves.';
    case 'APPROACHING':
      return hasAllocation
        ? 'Head to your assigned charger.'
        : 'Finding a compatible EVSE…';
    case 'READY':
      return 'Park at your assigned charger and wait for station staff.';
    case 'GRACE':
      return 'Please arrive at the station as soon as possible.';
    case 'CHARGING':
      return 'Your session is in progress at this station.';
    default:
      return 'Watch this screen for queue updates.';
  }
}
