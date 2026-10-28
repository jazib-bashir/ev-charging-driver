import type { Href } from 'expo-router';

const MAX_ROUTE_ID_LENGTH = 128;

const ACTIVE_SESSION_HREF = '/sessions/active' as Href;

const CHARGING_SESSION_STARTED_EVENT = 'CHARGING_SESSION_STARTED';
const CHARGING_SESSION_ENDED_EVENT = 'CHARGING_SESSION_ENDED';

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

/**
 * Maps notification data to an in-app route. Payloads are hints only; screens refetch state.
 */
export function resolveNotificationHref(data: unknown): Href | null {
  if (!isRecord(data)) {
    return null;
  }

  const stationId = parseRouteId(data.stationId);
  const sessionId = parseRouteId(data.sessionId);
  const event = parseEvent(data.event);
  const target = typeof data.target === 'string' ? data.target.trim() : '';

  if (target === 'active_session' || target === '/sessions/active') {
    return ACTIVE_SESSION_HREF;
  }

  if (sessionId) {
    return `/sessions/${sessionId}` as Href;
  }

  if (event === CHARGING_SESSION_ENDED_EVENT) {
    return null;
  }

  if (event === CHARGING_SESSION_STARTED_EVENT) {
    return ACTIVE_SESSION_HREF;
  }

  if (stationId) {
    return `/stations/${stationId}` as Href;
  }

  return null;
}
