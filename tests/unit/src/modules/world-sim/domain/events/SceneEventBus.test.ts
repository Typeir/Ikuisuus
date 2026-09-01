/**
 * @fileoverview Scene Event Bus Unit Tests
 * @description Tests typed event subscription, emission, unsubscription,
 * clear, and listener counting for the World Sim pub/sub system.
 *
 * @module tests/unit/src/modules/world-sim/domain/events/SceneEventBus.test
 */

import { SceneEventBus } from '@/modules/world-sim/domain/events/sceneEventBus';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('SceneEventBus', () => {
  let bus: SceneEventBus;

  afterEach(() => {
    vi.clearAllMocks();
  });

  /** Helper to create a fresh bus for each test */
  function createBus(): SceneEventBus {
    bus = new SceneEventBus();
    return bus;
  }

  it('delivers payload to subscribers', () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('body:click', handler);

    bus.emit('body:click', { bodyId: 'damocles' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ bodyId: 'damocles' });
  });

  it('supports multiple subscribers for the same event', () => {
    const bus = createBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('body:hover', handler1);
    bus.on('body:hover', handler2);

    bus.emit('body:hover', { bodyId: 'test' });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('does not call handler for different events', () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('body:click', handler);

    bus.emit('body:hover', { bodyId: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribes via returned function', () => {
    const bus = createBus();
    const handler = vi.fn();
    const unsub = bus.on('body:click', handler);

    unsub();
    bus.emit('body:click', { bodyId: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes event key when last listener unsubscribes', () => {
    const bus = createBus();
    const unsub = bus.on('body:click', vi.fn());

    expect(bus.listenerCount('body:click')).toBe(1);
    unsub();
    expect(bus.listenerCount('body:click')).toBe(0);
  });

  it('counts listeners correctly', () => {
    const bus = createBus();
    expect(bus.listenerCount('body:click')).toBe(0);

    const unsub1 = bus.on('body:click', vi.fn());
    const unsub2 = bus.on('body:click', vi.fn());
    expect(bus.listenerCount('body:click')).toBe(2);

    unsub1();
    expect(bus.listenerCount('body:click')).toBe(1);

    unsub2();
    expect(bus.listenerCount('body:click')).toBe(0);
  });

  it('clears all listeners for all events', () => {
    const bus = createBus();
    bus.on('body:click', vi.fn());
    bus.on('body:hover', vi.fn());
    bus.on('camera:transition:start', vi.fn());

    bus.clear();

    expect(bus.listenerCount('body:click')).toBe(0);
    expect(bus.listenerCount('body:hover')).toBe(0);
    expect(bus.listenerCount('camera:transition:start')).toBe(0);
  });

  it('handles emit with no subscribers gracefully', () => {
    const bus = createBus();

    expect(() => {
      bus.emit('body:click', { bodyId: 'test' });
    }).not.toThrow();
  });

  it('delivers camera transition events', () => {
    const bus = createBus();
    const startHandler = vi.fn();
    const endHandler = vi.fn();
    bus.on('camera:transition:start', startHandler);
    bus.on('camera:transition:end', endHandler);

    bus.emit('camera:transition:start', { command: 'zoom-to-body' });
    bus.emit('camera:transition:end', { command: 'zoom-to-body' });

    expect(startHandler).toHaveBeenCalledWith({ command: 'zoom-to-body' });
    expect(endHandler).toHaveBeenCalledWith({ command: 'zoom-to-body' });
  });
});
