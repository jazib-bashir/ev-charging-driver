/**
 * UI-phase mock presentation data for Journey Details.
 *
 * Prefer real API values in the screen. Only use these when a field is not
 * available from existing hooks/models. Keep this file easy to delete once
 * backend fields land.
 */

import type { HomeJourneyVisualVariant } from '@/utils/queue-display';

export type JourneyTimelineEvent = {
  id: string;
  label: string;
  atLabel: string;
  isLatest?: boolean;
};

export type JourneyPowerSample = {
  label: string;
  /** 0–1 relative bar height */
  intensity: number;
};

/** Mock wait when membership.estimatedTurnAt is missing. */
export const MOCK_ESTIMATED_WAIT_LABEL = '~6 min';

/** Mock check-in confirmation time when arrival timestamps are unavailable. */
export const MOCK_CHECK_IN_AT_LABEL = '4:32 PM';

export const MOCK_CHARGER_PREPARATION = {
  statusLabel: 'Preparing your charger',
  detail: 'An operator will assign your bay shortly.',
} as const;

export const MOCK_VEHICLE_LABEL = 'MG MG4';
export const MOCK_CHARGER_MODEL_LABEL = 'Raption 50';
export const MOCK_COST_UNAVAILABLE = {
  title: 'Not available',
  detail: 'This station has not provided a live tariff',
} as const;

export const MOCK_CHARGING_HEADLINE = 'Charging smoothly';

export const MOCK_POWER_HISTORY_WINDOW_LABEL = 'Last 18 minutes';

/** Simple rising power-history bars for the charging chart. */
export const MOCK_POWER_HISTORY: JourneyPowerSample[] = [
  { label: '0', intensity: 0.35 },
  { label: '2', intensity: 0.42 },
  { label: '4', intensity: 0.48 },
  { label: '6', intensity: 0.55 },
  { label: '8', intensity: 0.58 },
  { label: '10', intensity: 0.62 },
  { label: '12', intensity: 0.7 },
  { label: '14', intensity: 0.78 },
  { label: '16', intensity: 0.85 },
  { label: '18', intensity: 0.92 },
];

export const MOCK_STATION_FOOTER = {
  hoursLabel: 'Open 24 hours',
  operatorLabel: 'Operator on site',
} as const;

function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Builds timeline rows. Uses real `joinedAt` when present; later events are
 * mocked relative to join for UI completeness until backend timeline exists.
 */
export function buildJourneyTimelineEvents(options: {
  variant: HomeJourneyVisualVariant;
  joinedAt?: string | null;
  bayNumber?: string | null;
}): JourneyTimelineEvent[] {
  const { variant, joinedAt, bayNumber } = options;
  const joinDate = joinedAt ? new Date(joinedAt) : null;
  const joinValid = joinDate && !Number.isNaN(joinDate.getTime()) ? joinDate : null;

  const joinedLabel = joinValid ? formatClock(joinValid) : '4:04 PM';
  const arrivedLabel = joinValid
    ? formatClock(new Date(joinValid.getTime() + 14 * 60_000))
    : '4:18 PM';
  const assignedLabel = joinValid
    ? formatClock(new Date(joinValid.getTime() + 16 * 60_000))
    : '4:20 PM';
  const chargingLabel = joinValid
    ? formatClock(new Date(joinValid.getTime() + 18 * 60_000))
    : '4:22 PM';

  const bay = bayNumber?.trim() || '03';

  const events: JourneyTimelineEvent[] = [
    { id: 'joined', label: 'Joined queue', atLabel: joinedLabel },
  ];

  if (variant === 'queued' || variant === 'other' || variant === 'session-pending') {
    events[events.length - 1] = { ...events[0], isLatest: true };
    return events;
  }

  events.push({ id: 'arrived', label: 'Arrived at station', atLabel: arrivedLabel });

  if (variant === 'at-station') {
    events[events.length - 1] = { ...events[events.length - 1], isLatest: true };
    return events;
  }

  events.push({
    id: 'assigned',
    label: `Charger ${bay} assigned`,
    atLabel: assignedLabel,
  });

  if (variant === 'ready') {
    events[events.length - 1] = { ...events[events.length - 1], isLatest: true };
    return events;
  }

  events.push({
    id: 'charging',
    label: 'Charging started',
    atLabel: chargingLabel,
    isLatest: true,
  });

  return events;
}
