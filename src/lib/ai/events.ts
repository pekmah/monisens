const listeners = new Set<() => void>();

export function emitAiQueueUpdate() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToAiQueueUpdates(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
