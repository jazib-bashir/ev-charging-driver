import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/auth/auth-context';
import { gridflowRealtimeClient } from '@/realtime/gridflow-realtime-client';
import {
  subscribeGridflowRealtimeConnection,
  subscribeGridflowRealtimeEvents,
} from '@/realtime/gridflow-realtime-events';
import type { GridflowRealtimeEvent } from '@/realtime/gridflow-realtime-types';

type GridflowRealtimeProviderProps = {
  children: ReactNode;
};

export function GridflowRealtimeProvider({ children }: GridflowRealtimeProviderProps) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      gridflowRealtimeClient.disconnect();
      return;
    }

    gridflowRealtimeClient.connect(token);

    return () => {
      gridflowRealtimeClient.disconnect();
    };
  }, [token]);

  return children;
}

export function useGridflowRealtimeStation(stationId: string | null | undefined): void {
  useEffect(() => {
    if (!stationId) {
      return undefined;
    }

    gridflowRealtimeClient.subscribeStation(stationId);

    return () => {
      gridflowRealtimeClient.unsubscribeStation(stationId);
    };
  }, [stationId]);
}

export function useDebouncedGridflowRealtimeHandler(
  handler: (event: GridflowRealtimeEvent) => void,
  debounceMs = 400,
): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const seenEventIds = new Set<string>();
    let lastRevision = 0;
    const maxTrackedEventIds = 500;

    const unsubscribe = subscribeGridflowRealtimeEvents((event) => {
      if (seenEventIds.has(event.eventId)) {
        return;
      }

      seenEventIds.add(event.eventId);

      if (seenEventIds.size > maxTrackedEventIds) {
        const oldest = seenEventIds.values().next().value;
        if (oldest) {
          seenEventIds.delete(oldest);
        }
      }

      if (event.revision != null && event.revision < lastRevision) {
        return;
      }

      if (event.revision != null) {
        lastRevision = event.revision;
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        handler(event);
      }, debounceMs);
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [debounceMs, handler]);
}

export function useGridflowRealtimeReconnectSnapshot(onSnapshot: () => void): void {
  useEffect(() => {
    let hasConnectedOnce = false;

    return subscribeGridflowRealtimeConnection((connected) => {
      if (!connected) {
        return;
      }

      if (hasConnectedOnce) {
        onSnapshot();
      } else {
        hasConnectedOnce = true;
      }
    });
  }, [onSnapshot]);
}

export { subscribeGridflowRealtimeConnection, isGridflowRealtimeConnected } from '@/realtime/gridflow-realtime-events';
