export const GridflowRealtimeClientMessageType = {
  SUBSCRIBE_STATION: 'subscribe.station',
  UNSUBSCRIBE_STATION: 'unsubscribe.station',
  PING: 'ping',
} as const;

export const GridflowRealtimeServerMessageType = {
  AUTHENTICATED: 'authenticated',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  EVENT: 'event',
  ERROR: 'error',
  PONG: 'pong',
} as const;

export const GridflowRealtimeEventKind = {
  QUEUE_MEMBERSHIP: 'queue.membership',
  ACTIVE_SESSION: 'active_session',
  STATION_QUEUE: 'station.queue',
  STATION_EVSE: 'station.evse',
  STATION_ALLOCATION: 'station.allocation',
} as const;

export type GridflowRealtimeEventKindValue =
  (typeof GridflowRealtimeEventKind)[keyof typeof GridflowRealtimeEventKind];

export interface GridflowRealtimeEvent {
  kind: GridflowRealtimeEventKindValue;
  eventId: string;
  occurredAt: string;
  stationId?: string;
  queueMemberId?: string;
  evseId?: string;
  sessionId?: string;
  revision?: number;
}

export interface GridflowRealtimeEventMessage {
  type: typeof GridflowRealtimeServerMessageType.EVENT;
  audience: 'driver' | 'station_operator' | 'station_driver';
  event: GridflowRealtimeEvent;
}
