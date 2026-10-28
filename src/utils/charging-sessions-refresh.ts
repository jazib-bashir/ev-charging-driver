type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

export function subscribeChargingSessionsRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestChargingSessionsRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}
