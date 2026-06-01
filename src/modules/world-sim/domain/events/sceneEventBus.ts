/**
 * @fileoverview Scene Event Bus — Observer Pattern
 * @description Typed event emitter that decouples Three.js interactions from React UI updates.
 * Provides type-safe publish/subscribe for scene events without direct coupling between subsystems.
 *
 * @module worldSim/bridge/SceneEventBus
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Map of all event types to their payload shapes.
 * @interface WorldSimEvents
 */
export interface WorldSimEvents {
  'body:hover': { bodyId: string };
  'body:click': { bodyId: string };
  'body:unhover': { bodyId: string };
  'camera:transition:start': { command: string };
  'camera:transition:end': { command: string };
}

/**
 * Callback type for a specific event.
 * @typedef {Function} EventCallback
 */
type EventCallback<T> = T extends void ? () => void : (payload: T) => void;

/**
 * Typed event bus for World Sim scene events.
 * Decouples Three.js interaction detection from React state updates.
 *
 * @class SceneEventBus
 *
 * @example
 * ```ts
 * const bus = new SceneEventBus();
 * const unsub = bus.on('body:click', ({ bodyId }) => console.log(bodyId));
 * bus.emit('body:click', { bodyId: 'damocles' });
 * unsub();
 * ```
 */
export class SceneEventBus {
  /** @property {Map} listeners - Map of event names to subscriber sets */
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  /**
   * Subscribe to an event.
   *
   * @template K - Event name key
   * @param {K} event - Event name to subscribe to
   * @param {EventCallback<WorldSimEvents[K]>} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on<K extends keyof WorldSimEvents>(
    event: K,
    callback: EventCallback<WorldSimEvents[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(callback as EventCallback<unknown>);

    return () => {
      handlers.delete(callback as EventCallback<unknown>);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   *
   * @template K - Event name key
   * @param {K} event - Event name to emit
   * @param {WorldSimEvents[K]} payload - Event payload (omit for void events)
   */
  emit<K extends keyof WorldSimEvents>(
    event: K,
    ...args: WorldSimEvents[K] extends void ? [] : [payload: WorldSimEvents[K]]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    handlers.forEach((handler) => {
      (handler as (...a: unknown[]) => void)(...args);
    });
  }

  /**
   * Remove all listeners for all events.
   * Call during cleanup/dispose.
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get the count of listeners for a specific event.
   *
   * @param {keyof WorldSimEvents} event - Event name
   * @returns {number} Number of active listeners
   */
  listenerCount(event: keyof WorldSimEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
