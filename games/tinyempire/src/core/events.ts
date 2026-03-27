// ============================================================
// TinyEmpire — Typed Event Bus
// ============================================================

import type { GameEvent } from '../types/index.ts';

type EventType = GameEvent['type'];
type Callback<T extends GameEvent['type']> = (event: Extract<GameEvent, { type: T }>) => void;

// Internal storage uses the widest callable type per event type key.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCallback = (event: any) => void;

/**
 * Lightweight typed publish/subscribe bus.
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.on('buildingPlaced', (e) => console.log(e.building));
 *   bus.emit({ type: 'buildingPlaced', building: ... });
 */
export class EventBus {
  private readonly listeners = new Map<EventType, Set<AnyCallback>>();

  /** Register a typed listener for a specific event type. */
  on<T extends EventType>(type: T, callback: Callback<T>): void {
    let bucket = this.listeners.get(type);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(type, bucket);
    }
    bucket.add(callback as AnyCallback);
  }

  /** Remove a previously registered listener. No-op if not found. */
  off<T extends EventType>(type: T, callback: Callback<T>): void {
    const bucket = this.listeners.get(type);
    if (bucket) {
      bucket.delete(callback as AnyCallback);
    }
  }

  /** Dispatch an event to all registered listeners for its type. */
  emit(event: GameEvent): void {
    const bucket = this.listeners.get(event.type);
    if (bucket) {
      for (const cb of bucket) {
        cb(event);
      }
    }
  }

  /** Remove all listeners — useful for full resets. */
  clear(): void {
    this.listeners.clear();
  }
}
