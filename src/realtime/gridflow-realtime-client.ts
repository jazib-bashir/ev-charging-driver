import { getApiBaseUrl } from '@/config/env';
import {
  dispatchGridflowRealtimeEvent,
  notifyGridflowRealtimeConnection,
} from '@/realtime/gridflow-realtime-events';
import {
  GridflowRealtimeClientMessageType,
  GridflowRealtimeServerMessageType,
  type GridflowRealtimeEventMessage,
} from '@/realtime/gridflow-realtime-types';

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const PING_INTERVAL_MS = 25_000;

function buildWebSocketUrl(token: string): string {
  const httpBase = getApiBaseUrl();
  const wsBase = httpBase.replace(/^http/i, 'ws');
  const encodedToken = encodeURIComponent(token);
  return `${wsBase}/api/ws?token=${encodedToken}`;
}

export class GridflowRealtimeClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private subscribedStationIds = new Set<string>();
  private intentionalClose = false;

  connect(token: string): void {
    this.token = token;
    this.intentionalClose = false;
    this.closeSocket(false);
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.clearPingTimer();
    notifyGridflowRealtimeConnection(false);
    this.closeSocket(false);
  }

  subscribeStation(stationId: string): void {
    this.subscribedStationIds.add(stationId);
    this.send({
      type: GridflowRealtimeClientMessageType.SUBSCRIBE_STATION,
      stationId,
    });
  }

  unsubscribeStation(stationId: string): void {
    this.subscribedStationIds.delete(stationId);
    this.send({
      type: GridflowRealtimeClientMessageType.UNSUBSCRIBE_STATION,
      stationId,
    });
  }

  private closeSocket(notifyDisconnected: boolean): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (notifyDisconnected) {
      notifyGridflowRealtimeConnection(false);
    }
  }

  private openSocket(): void {
    if (!this.token) {
      return;
    }

    this.clearReconnectTimer();
    this.clearPingTimer();
    this.closeSocket(false);

    let url: string;

    try {
      url = buildWebSocketUrl(this.token);
    } catch (error) {
      console.error('[GridFlow realtime]', error);
      notifyGridflowRealtimeConnection(false);
      return;
    }

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
    };

    socket.onmessage = (message) => {
      this.handleMessage(String(message.data ?? ''));
    };

    socket.onclose = () => {
      notifyGridflowRealtimeConnection(false);
      this.clearPingTimer();
      this.socket = null;

      if (!this.intentionalClose && this.token) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private handleMessage(raw: string): void {
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = parsed.type;

    if (type === GridflowRealtimeServerMessageType.AUTHENTICATED) {
      notifyGridflowRealtimeConnection(true);
      this.startPing();
      this.resubscribeStations();
      return;
    }

    if (type === GridflowRealtimeServerMessageType.ERROR) {
      console.warn('[GridFlow realtime]', parsed.message ?? 'Server error');
      return;
    }

    if (type === GridflowRealtimeServerMessageType.EVENT) {
      const eventMessage = parsed as unknown as GridflowRealtimeEventMessage;
      if (eventMessage.event) {
        dispatchGridflowRealtimeEvent(eventMessage.event);
      }
    }
  }

  private resubscribeStations(): void {
    for (const stationId of this.subscribedStationIds) {
      this.send({
        type: GridflowRealtimeClientMessageType.SUBSCRIBE_STATION,
        stationId,
      });
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
    );
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  private startPing(): void {
    this.clearPingTimer();
    this.pingTimer = setInterval(() => {
      this.send({ type: GridflowRealtimeClientMessageType.PING });
    }, PING_INTERVAL_MS);
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }
}

export const gridflowRealtimeClient = new GridflowRealtimeClient();
