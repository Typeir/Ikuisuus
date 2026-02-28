/**
 * @fileoverview Render Lifecycle Unit Tests
 * @description Tests phase-based subscriber registration, priority ordering,
 * phase isolation, convenience methods, subscriber counts, and cleanup.
 *
 * @module tests/unit/worldSim/canvas/RenderLifecycle
 */

import {
    RenderLifecycle,
    RenderPhase,
    type FrameContext,
} from '@/lib/components/worldSim/canvas/RenderLifecycle';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Create a minimal mock FrameContext for testing */
function mockContext(overrides: Partial<FrameContext> = {}): FrameContext {
  return {
    renderer: {} as FrameContext['renderer'],
    scene: {} as FrameContext['scene'],
    camera: {} as FrameContext['camera'],
    canvas: {} as FrameContext['canvas'],
    time: 1.0,
    deltaTime: 0.016,
    frame: 1,
    ...overrides,
  };
}

describe('RenderLifecycle', () => {
  let lifecycle: RenderLifecycle;

  afterEach(() => {
    vi.clearAllMocks();
  });

  function create(): RenderLifecycle {
    lifecycle = new RenderLifecycle();
    return lifecycle;
  }

  it('calls subscribers during their registered phase', () => {
    const lc = create();
    const handler = vi.fn();
    lc.on(RenderPhase.Update, handler);

    lc.runPhase(RenderPhase.Update, mockContext());

    expect(handler).toHaveBeenCalledOnce();
  });

  it('passes FrameContext to subscribers', () => {
    const lc = create();
    const handler = vi.fn();
    lc.on(RenderPhase.Update, handler);

    const ctx = mockContext({ time: 5.0, deltaTime: 0.033, frame: 42 });
    lc.runPhase(RenderPhase.Update, ctx);

    expect(handler).toHaveBeenCalledWith(ctx);
  });

  it('does not call subscribers in a different phase', () => {
    const lc = create();
    const handler = vi.fn();
    lc.on(RenderPhase.Update, handler);

    lc.runPhase(RenderPhase.PostRender, mockContext());

    expect(handler).not.toHaveBeenCalled();
  });

  it('executes subscribers in priority order (lower first)', () => {
    const lc = create();
    const order: number[] = [];

    lc.on(RenderPhase.Update, () => order.push(3), { priority: 300 });
    lc.on(RenderPhase.Update, () => order.push(1), { priority: 10 });
    lc.on(RenderPhase.Update, () => order.push(2), { priority: 50 });

    lc.runPhase(RenderPhase.Update, mockContext());

    expect(order).toEqual([1, 2, 3]);
  });

  it('uses default priority 100 when none specified', () => {
    const lc = create();
    const order: string[] = [];

    lc.on(RenderPhase.Update, () => order.push('high'), { priority: 200 });
    lc.on(RenderPhase.Update, () => order.push('default'));
    lc.on(RenderPhase.Update, () => order.push('low'), { priority: 10 });

    lc.runPhase(RenderPhase.Update, mockContext());

    expect(order).toEqual(['low', 'default', 'high']);
  });

  it('unsubscribes via returned function', () => {
    const lc = create();
    const handler = vi.fn();
    const unsub = lc.on(RenderPhase.Update, handler);

    unsub();
    lc.runPhase(RenderPhase.Update, mockContext());

    expect(handler).not.toHaveBeenCalled();
  });

  it('reports subscriber counts per phase', () => {
    const lc = create();
    expect(lc.subscriberCount(RenderPhase.Update)).toBe(0);

    lc.on(RenderPhase.Update, vi.fn());
    lc.on(RenderPhase.Update, vi.fn());
    lc.on(RenderPhase.PostRender, vi.fn());

    expect(lc.subscriberCount(RenderPhase.Update)).toBe(2);
    expect(lc.subscriberCount(RenderPhase.PostRender)).toBe(1);
    expect(lc.subscriberCount(RenderPhase.PreUpdate)).toBe(0);
  });

  it('clears all phases', () => {
    const lc = create();
    lc.on(RenderPhase.PreUpdate, vi.fn());
    lc.on(RenderPhase.Update, vi.fn());
    lc.on(RenderPhase.PostRender, vi.fn());

    lc.clear();

    expect(lc.subscriberCount(RenderPhase.PreUpdate)).toBe(0);
    expect(lc.subscriberCount(RenderPhase.Update)).toBe(0);
    expect(lc.subscriberCount(RenderPhase.PostRender)).toBe(0);
  });

  it('runPreRenderPhases executes four phases in order', () => {
    const lc = create();
    const order: string[] = [];

    lc.on(RenderPhase.PreUpdate, () => order.push('PreUpdate'));
    lc.on(RenderPhase.Update, () => order.push('Update'));
    lc.on(RenderPhase.PostUpdate, () => order.push('PostUpdate'));
    lc.on(RenderPhase.PreRender, () => order.push('PreRender'));
    lc.on(RenderPhase.PostRender, () => order.push('PostRender'));

    lc.runPreRenderPhases(mockContext());

    expect(order).toEqual(['PreUpdate', 'Update', 'PostUpdate', 'PreRender']);
    expect(order).not.toContain('PostRender');
  });

  it('runPostRenderPhases executes only PostRender', () => {
    const lc = create();
    const order: string[] = [];

    lc.on(RenderPhase.Update, () => order.push('Update'));
    lc.on(RenderPhase.PostRender, () => order.push('PostRender'));

    lc.runPostRenderPhases(mockContext());

    expect(order).toEqual(['PostRender']);
  });

  it('handles runPhase with no subscribers gracefully', () => {
    const lc = create();

    expect(() => {
      lc.runPhase(RenderPhase.Update, mockContext());
    }).not.toThrow();
  });

  it('RenderPhase enum has correct numeric ordering', () => {
    expect(RenderPhase.PreUpdate).toBe(0);
    expect(RenderPhase.Update).toBe(1);
    expect(RenderPhase.PostUpdate).toBe(2);
    expect(RenderPhase.PreRender).toBe(3);
    expect(RenderPhase.PostRender).toBe(4);
  });
});
