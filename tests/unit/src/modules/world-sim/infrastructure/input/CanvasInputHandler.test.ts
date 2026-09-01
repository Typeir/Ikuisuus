/**
 * @fileoverview CanvasInputHandler Unit Tests
 * @description Tests pointer event binding and raycast dispatching for the
 * World Sim canvas input handler.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/input/CanvasInputHandler.test
 */

import { CanvasInputHandler } from '@/modules/world-sim/infrastructure/input/CanvasInputHandler';
import type { RaycastService } from '@/modules/world-sim/application/services/RaycastService';
import { PerspectiveCamera } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockRaycaster {
  raycastBody: ReturnType<typeof vi.fn>;
}

/**
 * Build a deterministic mock raycast service that returns a fixed body ID.
 *
 * @param {string | null} returnId - Body ID to return from raycastBody
 * @returns Mock raycast service
 */
function makeRaycaster(returnId: string | null): MockRaycaster {
  return {
    raycastBody: vi.fn().mockReturnValue(returnId),
  };
}

describe('CanvasInputHandler', () => {
  let canvas: HTMLCanvasElement;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    camera = new PerspectiveCamera();
  });

  it('fires onBodyClick when a body is hit and not transitioning', () => {
    const raycaster = makeRaycaster('damocles');
    const onBodyClick = vi.fn();
    const handler = new CanvasInputHandler({
      canvas,
      camera,
      getCanvasRect: () => canvas.getBoundingClientRect(),
      raycastService: raycaster as unknown as RaycastService,
      isTransitioning: () => false,
      onBodyClick,
      onHoverChange: vi.fn(),
    });
    handler.attach();
    canvas.dispatchEvent(new MouseEvent('click'));
    expect(onBodyClick).toHaveBeenCalledWith('damocles');
  });

  it('suppresses callbacks during a camera transition', () => {
    const raycaster = makeRaycaster('damocles');
    const onBodyClick = vi.fn();
    const onHoverChange = vi.fn();
    const handler = new CanvasInputHandler({
      canvas,
      camera,
      getCanvasRect: () => canvas.getBoundingClientRect(),
      raycastService: raycaster as unknown as RaycastService,
      isTransitioning: () => true,
      onBodyClick,
      onHoverChange,
    });
    handler.attach();
    canvas.dispatchEvent(new MouseEvent('click'));
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    expect(onBodyClick).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
  });

  it('fires onHoverChange only when the hovered body changes', () => {
    const raycaster = makeRaycaster('damocles');
    const onHoverChange = vi.fn();
    const handler = new CanvasInputHandler({
      canvas,
      camera,
      getCanvasRect: () => canvas.getBoundingClientRect(),
      raycastService: raycaster as unknown as RaycastService,
      isTransitioning: () => false,
      onBodyClick: vi.fn(),
      onHoverChange,
    });
    handler.attach();
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    expect(onHoverChange).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledWith('damocles');
  });

  it('detach removes listeners and resets hover state', () => {
    const raycaster = makeRaycaster('damocles');
    const onHoverChange = vi.fn();
    const handler = new CanvasInputHandler({
      canvas,
      camera,
      getCanvasRect: () => canvas.getBoundingClientRect(),
      raycastService: raycaster as unknown as RaycastService,
      isTransitioning: () => false,
      onBodyClick: vi.fn(),
      onHoverChange,
    });
    handler.attach();
    handler.detach();
    canvas.dispatchEvent(new MouseEvent('click'));
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    expect(onHoverChange).not.toHaveBeenCalled();
  });
});
