import type { GridflowRealtimeEvent } from '@/realtime/gridflow-realtime-types';

type RealtimeListener = (event: GridflowRealtimeEvent) => void;
type ConnectionListener = (connected: boolean) => void;

const eventListeners = new Set<RealtimeListener>();
const connectionListeners = new Set<ConnectionListener>();

export function subscribeGridflowRealtimeEvents(listener: RealtimeListener): () => void {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

export function subscribeGridflowRealtimeConnection(listener: ConnectionListener): () => void {
  listener(isGridflowRealtimeConnected());
  connectionListeners.add(listener);
  return () => {
    connectionListeners.delete(listener);
  };
}

let connected = false;

export function isGridflowRealtimeConnected(): boolean {
  return connected;
}

export function notifyGridflowRealtimeConnection(nextConnected: boolean): void {
  if (connected === nextConnected) {
    return;
  }

  connected = nextConnected;

  for (const listener of connectionListeners) {
    listener(nextConnected);
  }
}

export function dispatchGridflowRealtimeEvent(event: GridflowRealtimeEvent): void {
  for (const listener of eventListeners) {
    listener(event);
  }
}
