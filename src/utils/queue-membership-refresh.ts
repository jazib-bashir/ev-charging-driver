type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

export function subscribeQueueMembershipRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestQueueMembershipRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}
