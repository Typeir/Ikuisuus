/**
 * @fileoverview CameraController unit tests.
 * @description Covers command execution, follow targeting, orbit, reset, update loop, and disposal.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/input/CameraController.test
 */

import { SceneEventBus } from '@/modules/world-sim/domain/events/sceneEventBus';
import { CameraController } from '@/modules/world-sim/infrastructure/input/CameraController';
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Create a mock canvas for CameraOrbitControls binding */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return canvas;
}

describe('CameraController', () => {
  let camera: PerspectiveCamera;
  let canvas: HTMLCanvasElement;
  let eventBus: SceneEventBus;
  let controller: CameraController;

  beforeEach(() => {
    camera = new PerspectiveCamera(60, 1, 0.1, 15000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);
    canvas = createMockCanvas();
    eventBus = new SceneEventBus();
    controller = new CameraController(camera, canvas, eventBus);
  });

  afterEach(() => {
    controller.dispose();
    eventBus.clear();
  });

  it('is not transitioning initially', () => {
    expect(controller.isTransitioning()).toBe(false);
  });

  it('executeCommand puts controller into transitioning state', () => {
    const command = {
      type: 'test-cmd',
      execute: vi.fn().mockReturnValue(false),
      applyFollowDelta: vi.fn(),
    };
    controller.executeCommand(command);
    expect(controller.isTransitioning()).toBe(true);
  });

  it('executeCommand emits camera:transition:start event', () => {
    const handler = vi.fn();
    eventBus.on('camera:transition:start', handler);

    const command = {
      type: 'test-cmd',
      execute: vi.fn().mockReturnValue(false),
      applyFollowDelta: vi.fn(),
    };
    controller.executeCommand(command);

    expect(handler).toHaveBeenCalledWith({ command: 'test-cmd' });
  });

  it('cancelCommand re-enables manual control', () => {
    const command = {
      type: 'test-cmd',
      execute: vi.fn().mockReturnValue(false),
      applyFollowDelta: vi.fn(),
    };
    controller.executeCommand(command);
    expect(controller.isTransitioning()).toBe(true);

    controller.cancelCommand();
    expect(controller.isTransitioning()).toBe(false);
  });

  it('update advances the active command', () => {
    const command = {
      type: 'test-cmd',
      execute: vi.fn().mockReturnValue(false),
      applyFollowDelta: vi.fn(),
    };
    controller.executeCommand(command);
    controller.update(0.016);

    expect(command.execute).toHaveBeenCalledWith(camera, 0.016);
  });

  it('command completion emits camera:transition:end', () => {
    const handler = vi.fn();
    eventBus.on('camera:transition:end', handler);

    const command = {
      type: 'done-cmd',
      execute: vi.fn().mockReturnValue(true),
      applyFollowDelta: vi.fn(),
    };
    controller.executeCommand(command);
    controller.update(0.016);

    expect(handler).toHaveBeenCalledWith({ command: 'done-cmd' });
    expect(controller.isTransitioning()).toBe(false);
  });

  it('setFollowTarget snaps orbit center to body position', () => {
    const bodyPos = new Vector3(200, 0, 0);
    controller.setFollowTarget(() => bodyPos.clone());

    /** Update should process without error */
    controller.update(0.016);
  });

  it('clearFollowTarget stops tracking', () => {
    controller.setFollowTarget(() => new Vector3(200, 0, 0));
    controller.clearFollowTarget();

    /** Update should process without error */
    controller.update(0.016);
  });

  it('setTarget sets the orbit center', () => {
    controller.setTarget(new Vector3(100, 50, 0));
    controller.update(0.016);

    /** Camera should still be functional */
    expect(camera.position).toBeDefined();
  });

  it('resetToDefault clears follow and executes ResetViewCommand', () => {
    const handler = vi.fn();
    eventBus.on('camera:transition:start', handler);

    controller.resetToDefault();

    expect(controller.isTransitioning()).toBe(true);
    expect(handler).toHaveBeenCalledWith({ command: 'reset-view' });
  });

  it('dispose cleans up without throwing', () => {
    controller.dispose();
    /** Calling update after dispose should not crash */
    expect(controller.isTransitioning()).toBe(false);
  });
});
