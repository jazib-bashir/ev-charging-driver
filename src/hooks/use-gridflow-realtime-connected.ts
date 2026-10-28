import { useEffect, useState } from 'react';

import {
  isGridflowRealtimeConnected,
  subscribeGridflowRealtimeConnection,
} from '@/realtime/gridflow-realtime-events';

export function useGridflowRealtimeConnected(): boolean {
  const [connected, setConnected] = useState(isGridflowRealtimeConnected());

  useEffect(() => {
    return subscribeGridflowRealtimeConnection(setConnected);
  }, []);

  return connected;
}
