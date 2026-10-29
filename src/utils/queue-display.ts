import type { QueueMember, QueueMemberAllocationSummary } from '@/types/queue';
import { hasMetricValue } from '@/utils/charging-session-format';

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

/** Relative wait for Home queued card (e.g. "~6 min"). */
export function formatEstimatedWaitRelative(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const minutes = Math.max(0, Math.round((date.getTime() - Date.now()) / 60_000));

  if (minutes <= 0) {
    return '< 1 min';
  }

  return `~${minutes} min`;
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

export function formatQueuePositionPadded(member: QueueMember): string | null {
  const rank = getQueueRank(member);

  if (!Number.isFinite(rank) || rank <= 0) {
    return null;
  }

  return String(rank).padStart(2, '0');
}

export function formatDriversAheadHeadline(member: QueueMember): string | null {
  const ahead = getPeopleAhead(member);

  if (!Number.isFinite(ahead)) {
    return null;
  }

  if (ahead === 0) {
    return "You're next";
  }

  return `${ahead} driver${ahead === 1 ? '' : 's'} ahead`;
}

export function formatDriversAheadSubtext(member: QueueMember): string | null {
  const ahead = getPeopleAhead(member);

  if (!Number.isFinite(ahead)) {
    return null;
  }

  return 'Stay nearby. We’ll let you know as soon as a charger is ready.';
}

export function formatQueuedCenterEyebrow(): string {
  return "You're in the queue";
}

export function formatReadyChargerBayNumber(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const label = allocation?.evse?.label?.trim();

  if (!label) {
    return null;
  }

  const stripped = label.replace(/^evse\s*/i, '').replace(/^charger\s*/i, '').trim();

  return stripped || null;
}

export type HomeJourneyVisualVariant =
  | 'queued'
  | 'at-station'
  | 'ready'
  | 'charging'
  | 'session-pending'
  | 'other';

export function resolveHomeJourneyVisualVariant(
  membership: QueueMember | null | undefined,
  options?: { hasActiveSession?: boolean; chargingWithoutSession?: boolean },
): HomeJourneyVisualVariant {
  if (options?.hasActiveSession) {
    return 'charging';
  }

  if (!membership) {
    return 'other';
  }

  if (options?.chargingWithoutSession || membership.state === 'CHARGING') {
    return 'session-pending';
  }

  if (membership.state === 'APPROACHING') {
    return 'at-station';
  }

  if (membership.state === 'READY') {
    return 'ready';
  }

  if (membership.state === 'QUEUED') {
    return 'queued';
  }

  return 'other';
}

export function resolveHomeJourneyStepIndex(variant: HomeJourneyVisualVariant): number {
  switch (variant) {
    case 'at-station':
      return 1;
    case 'ready':
      return 2;
    case 'charging':
    case 'session-pending':
      return 3;
    default:
      return 0;
  }
}

export function homeJourneyStatusBadgeLabel(variant: HomeJourneyVisualVariant): string {
  switch (variant) {
    case 'at-station':
      return 'Checked In';
    case 'ready':
      return 'Ready';
    case 'charging':
      return 'Charging';
    case 'session-pending':
      return 'Connecting';
    case 'queued':
      return 'Queued';
    default:
      return 'Queued';
  }
}

export function homeJourneyActionLabel(variant: HomeJourneyVisualVariant): string {
  switch (variant) {
    case 'at-station':
      return 'View arrival journey';
    case 'ready':
      return 'Open charger journey';
    case 'charging':
      return 'Open live session';
    case 'session-pending':
      return 'View journey details';
    default:
      return 'View queue journey';
  }
}

/** Secondary line under the Home journey CTA (Figma). */
export function homeJourneyActionSubtitle(variant: HomeJourneyVisualVariant): string {
  switch (variant) {
    case 'at-station':
      return 'Check-in details and station instructions';
    case 'ready':
      return 'Wayfinding and connection instructions';
    case 'charging':
      return 'Telemetry, timeline and charger details';
    case 'session-pending':
      return 'Timeline, station access and next steps';
    default:
      return 'Timeline, station access and next steps';
  }
}

export const EVSE_UNAVAILABLE_MESSAGE =
  'Your assigned charger is currently unavailable. The station is finding another compatible charger.';

export function hasOperationalEvseAllocation(
  allocation: QueueMemberAllocationSummary | null | undefined,
): boolean {
  return allocation?.evse?.status === 'AVAILABLE';
}

export function formatAssignedEvse(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  if (!hasOperationalEvseAllocation(allocation)) {
    return null;
  }

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

/** Assigned charger/connector label for Home READY card (does not require EVSE AVAILABLE). */
export function formatReadyAssignedChargerIdentifier(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const evse = allocation?.evse;

  if (!evse?.label?.trim()) {
    return null;
  }

  const connectorLabel = evse.connectorTypes?.filter(Boolean).join(', ');
  const powerLabel = hasMetricValue(evse.maxPowerKw) ? `${evse.maxPowerKw} kW` : null;
  const parts = [`EVSE ${evse.label.trim()}`];

  if (connectorLabel) {
    parts.push(connectorLabel);
  }

  if (powerLabel) {
    parts.push(powerLabel);
  }

  return parts.join(' · ');
}

/** Home Ready card — primary charger title (e.g. "Charger 03"). */
export function formatReadyAssignedChargerTitle(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const rawLabel = allocation?.evse?.label?.trim();

  if (!rawLabel) {
    return null;
  }

  if (/^charger\b/i.test(rawLabel)) {
    return rawLabel;
  }

  const stripped = rawLabel.replace(/^evse\s*/i, '').trim();

  return stripped ? `Charger ${stripped}` : null;
}

/** First connector type for Ready card badge (e.g. CCS2). */
export function formatReadyConnectorBadge(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  const connector = allocation?.evse?.connectorTypes?.find(Boolean);

  return connector ?? null;
}

export function getAtStationPreparationHeadline(membership: QueueMember): string {
  if (membership.needsEvseReassignment) {
    return 'Finding a compatible charger';
  }

  return 'Preparing your charger';
}

export type HomeQueueJourneyVariant = 'queued' | 'at-station' | 'ready' | 'session-pending' | 'other';

export function resolveHomeQueueJourneyVariant(
  membership: QueueMember,
  options?: { chargingWithoutSession?: boolean },
): HomeQueueJourneyVariant {
  if (options?.chargingWithoutSession || membership.state === 'CHARGING') {
    return 'session-pending';
  }

  if (membership.state === 'APPROACHING') {
    return 'at-station';
  }

  if (membership.state === 'READY') {
    return 'ready';
  }

  if (membership.state === 'QUEUED') {
    return 'queued';
  }

  return 'other';
}

export function formatEvseHeadline(
  allocation: QueueMemberAllocationSummary | null | undefined,
): string | null {
  if (!hasOperationalEvseAllocation(allocation) || !allocation?.evse) {
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
  options: {
    hasOperationalAllocation: boolean;
    needsEvseReassignment?: boolean;
  },
): string {
  const { hasOperationalAllocation, needsEvseReassignment = false } = options;

  if (needsEvseReassignment) {
    return EVSE_UNAVAILABLE_MESSAGE;
  }

  switch (state) {
    case 'QUEUED':
      return 'We will update your estimated turn as the queue moves.';
    case 'APPROACHING':
      return hasOperationalAllocation
        ? 'Head to your assigned charger.'
        : 'Finding a compatible EVSE…';
    case 'READY':
      return hasOperationalAllocation
        ? 'Park at your assigned charger and wait for station staff.'
        : 'Finding a compatible EVSE…';
    case 'GRACE':
      return 'Please arrive at the station as soon as possible.';
    case 'CHARGING':
      return 'Your session is in progress at this station.';
    default:
      return 'Watch this screen for queue updates.';
  }
}
