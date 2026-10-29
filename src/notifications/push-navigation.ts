import type { Href } from 'expo-router';

const MAX_ROUTE_ID_LENGTH = 128;

const JOURNEY_DETAILS_BASE = '/journey/details';

const CHARGING_SESSION_STARTED_EVENT = 'CHARGING_SESSION_STARTED';
const CHARGING_SESSION_ENDED_EVENT = 'CHARGING_SESSION_ENDED';
const QUEUE_BOOKING_CANCELLED_EVENT = 'QUEUE_BOOKING_CANCELLED';

/** Queue / charging push events that should open Journey details. */
const JOURNEY_DETAILS_EVENTS = new Set([
  'QUEUE_BOOKING_CONFIRMED',
  'QUEUE_TURN_APPROACHING',
  'QUEUE_BAY_ALLOCATED',
  'QUEUE_POSITION_UPDATED',
  'QUEUE_TURN_READY',
  CHARGING_SESSION_STARTED_EVENT,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRouteId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const id = value.trim();

  if (!id || id.length > MAX_ROUTE_ID_LENGTH || /[/?#]/.test(id)) {
    return null;
  }

  return id;
}

function parseEvent(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const event = value.trim();
  return event.length > 0 ? event : null;
}

function buildJourneyDetailsHref(fields: {
  stationId?: string | null;
  membershipId?: string | null;
  sessionId?: string | null;
}): Href {
  const params = new URLSearchParams();

  if (fields.stationId) {
    params.set('stationId', fields.stationId);
  }
  if (fields.membershipId) {
    params.set('membershipId', fields.membershipId);
  }
  if (fields.sessionId) {
    params.set('sessionId', fields.sessionId);
  }

  const query = params.toString();
  return (query ? `${JOURNEY_DETAILS_BASE}?${query}` : JOURNEY_DETAILS_BASE) as Href;
}

/**
 * Maps notification data to an in-app route. Payloads are hints only; screens refetch state.
 */
export function resolveNotificationHref(data: unknown): Href | null {
  if (!isRecord(data)) {
    return null;
  }

  const stationId = parseRouteId(data.stationId);
  const sessionId = parseRouteId(data.sessionId);
  const membershipId =
    parseRouteId(data.membershipId) ?? parseRouteId(data.queueMemberId);
  const event = parseEvent(data.event);
  const target = typeof data.target === 'string' ? data.target.trim() : '';

  if (event === CHARGING_SESSION_ENDED_EVENT) {
    return null;
  }

  if (event === QUEUE_BOOKING_CANCELLED_EVENT) {
    return stationId ? (`/stations/${stationId}` as Href) : ('/' as Href);
  }

  const shouldOpenJourneyDetails =
    target === 'active_session' ||
    target === '/sessions/active' ||
    target === 'journey_details' ||
    target === '/journey/details' ||
    (event != null && JOURNEY_DETAILS_EVENTS.has(event)) ||
    Boolean(membershipId) ||
    Boolean(sessionId);

  if (shouldOpenJourneyDetails) {
    return buildJourneyDetailsHref({
      stationId,
      membershipId,
      sessionId,
    });
  }

  if (stationId) {
    return `/stations/${stationId}` as Href;
  }

  return null;
}
