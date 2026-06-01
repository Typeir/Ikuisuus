/**
 * @fileoverview ProjectionBridge Unit Tests
 * @description Tests tracking, untracking, subscription, bound element DOM updates,
 * occlusion, scale computation, and clear() cleanup.
 *
 * @module tests/unit/worldSim/bridge/ProjectionBridge
 */

import { ProjectionBridge } from '@/modules/world-sim/infrastructure/bridge/ProjectionBridge';
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ProjectionBridge', () => {
  let bridge: ProjectionBridge;

  beforeEach(() => {
    bridge = new ProjectionBridge();
  });

  afterEach(() => {
    bridge.clear();
  });

  it('tracks a point and returns its ID', () => {
    bridge.track('body-a', new Vector3(100, 0, 0));
    expect(bridge.getTrackedIds()).toContain('body-a');
  });

  it('untracks a point and removes it', () => {
    bridge.track('body-a', new Vector3(100, 0, 0));
    bridge.untrack('body-a');
    expect(bridge.getTrackedIds()).not.toContain('body-a');
  });

  it('updatePosition updates existing tracked point', () => {
    bridge.track('body-a', new Vector3(100, 0, 0));
    bridge.updatePosition('body-a', new Vector3(200, 0, 0));
    expect(bridge.getTrackedIds()).toContain('body-a');
  });

  it('updatePosition creates new tracking if not exists', () => {
    bridge.updatePosition('new-body', new Vector3(100, 0, 0));
    expect(bridge.getTrackedIds()).toContain('new-body');
  });

  it('subscribe returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = bridge.subscribe(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('update calls subscribers with projected positions', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const canvasRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;
    bridge.track('body-a', new Vector3(0, 0, 0));

    const cb = vi.fn();
    bridge.subscribe(cb);

    bridge.update(camera, canvasRect);

    expect(cb).toHaveBeenCalledTimes(1);
    const positions = cb.mock.calls[0][0] as Map<string, any>;
    expect(positions.has('body-a')).toBe(true);
  });

  it('getPosition returns projected position after update', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const canvasRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;
    bridge.track('body-a', new Vector3(0, 0, 0));
    bridge.update(camera, canvasRect);

    const pos = bridge.getPosition('body-a');
    expect(pos).toBeDefined();
    expect(pos!.visible).toBe(true);
    expect(typeof pos!.x).toBe('number');
    expect(typeof pos!.scale).toBe('number');
  });

  it('bound element gets CSS transform applied', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const canvasRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;
    bridge.track('body-a', new Vector3(0, 0, 0));

    const el = document.createElement('div');
    bridge.bindElement('body-a', el);

    bridge.update(camera, canvasRect);

    expect(el.style.visibility).toBe('visible');
    expect(el.style.transform).toContain('translate(');
  });

  it('bound element gets hidden when occluded', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const canvasRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;
    bridge.track('body-a', new Vector3(0, 0, 0));

    const el = document.createElement('div');
    bridge.bindElement('body-a', el);

    bridge.setOccluded(new Set(['body-a']));
    bridge.update(camera, canvasRect);

    expect(el.style.visibility).toBe('hidden');
  });

  it('unbindElement removes DOM management', () => {
    const el = document.createElement('div');
    bridge.bindElement('body-a', el);
    bridge.unbindElement('body-a');

    /** No error on update without bound element */
    const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    bridge.track('body-a', new Vector3(0, 0, 0));
    bridge.update(camera, {
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    } as DOMRect);
  });

  it('clear removes all state', () => {
    bridge.track('body-a', new Vector3(0, 0, 0));
    bridge.subscribe(vi.fn());
    bridge.bindElement('body-a', document.createElement('div'));

    bridge.clear();

    expect(bridge.getTrackedIds()).toEqual([]);
    expect(bridge.getPosition('body-a')).toBeUndefined();
  });
});
