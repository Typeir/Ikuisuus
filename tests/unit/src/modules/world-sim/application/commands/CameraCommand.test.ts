/**
 * @fileoverview CameraCommand Unit Tests
 * @description Tests ZoomToBodyCommand, ZoomToRegionCommand, and ResetViewCommand
 * for transition execution, completion, and follow delta application.
 *
 * @module tests/unit/src/modules/world-sim/application/commands/CameraCommand.test
 */

import {
    ResetViewCommand,
    ZoomToBodyCommand,
    ZoomToRegionCommand,
} from '@/modules/world-sim/application/commands/CameraCommand';
import {
    DEFAULT_CAMERA_POSITION
} from '@/modules/world-sim/infrastructure/constants';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

/** Create a fresh camera at a given position */
function makeCamera(pos: Vector3): PerspectiveCamera {
  const camera = new PerspectiveCamera(60, 1, 0.1, 15000);
  camera.position.copy(pos);
  camera.lookAt(0, 0, 0);
  return camera;
}

describe('ZoomToBodyCommand', () => {
  it('has type zoom-to-body', () => {
    const cmd = new ZoomToBodyCommand(new Vector3(100, 0, 0), 20, 'body-1');
    expect(cmd.type).toBe('zoom-to-body');
  });

  it('exposes the bodyId', () => {
    const cmd = new ZoomToBodyCommand(new Vector3(100, 0, 0), 20, 'body-1');
    expect(cmd.bodyId).toBe('body-1');
  });

  it('moves camera toward the target over many frames', () => {
    const bodyPos = new Vector3(100, 0, 0);
    const cmd = new ZoomToBodyCommand(bodyPos, 20, 'body-1');
    const camera = makeCamera(new Vector3(0, 0, 400));

    const startDist = camera.position.distanceTo(bodyPos);

    for (let i = 0; i < 100; i++) {
      cmd.execute(camera, 0.016);
    }

    const endDist = camera.position.distanceTo(bodyPos);
    expect(endDist).toBeLessThan(startDist);
  });

  it('eventually returns true when transition completes', () => {
    const bodyPos = new Vector3(100, 0, 0);
    const cmd = new ZoomToBodyCommand(bodyPos, 20, 'body-1');
    const camera = makeCamera(new Vector3(100, 0, 25));

    let complete = false;
    for (let i = 0; i < 500 && !complete; i++) {
      complete = cmd.execute(camera, 0.016);
    }

    expect(complete).toBe(true);
  });

  it('applyFollowDelta shifts target positions', () => {
    const bodyPos = new Vector3(100, 0, 0);
    const cmd = new ZoomToBodyCommand(bodyPos, 20, 'body-1');
    const camera = makeCamera(new Vector3(0, 0, 400));

    /** Initialize the transition */
    cmd.execute(camera, 0.016);

    /** Apply delta */
    const delta = new Vector3(10, 5, 0);
    cmd.applyFollowDelta(delta);

    /** No error expected */
    cmd.execute(camera, 0.016);
  });

  it('applyFollowDelta is a no-op before initialization', () => {
    const cmd = new ZoomToBodyCommand(new Vector3(100, 0, 0), 20, 'body-1');
    /** Should not throw */
    cmd.applyFollowDelta(new Vector3(5, 5, 5));
  });
});

describe('ZoomToRegionCommand', () => {
  it('has type zoom-to-region', () => {
    const cmd = new ZoomToRegionCommand(
      new Vector3(100, 10, 0),
      new Vector3(100, 0, 0),
      5,
      'reg-1',
    );
    expect(cmd.type).toBe('zoom-to-region');
  });

  it('exposes the regionId', () => {
    const cmd = new ZoomToRegionCommand(
      new Vector3(100, 10, 0),
      new Vector3(100, 0, 0),
      5,
      'reg-1',
    );
    expect(cmd.regionId).toBe('reg-1');
  });

  it('uses time-based progression and completes at duration', () => {
    const regionPos = new Vector3(130, 0, 0);
    const planetCenter = new Vector3(100, 0, 0);
    const cmd = new ZoomToRegionCommand(regionPos, planetCenter, 5, 'reg-1');
    const camera = makeCamera(new Vector3(100, 0, 50));

    let complete = false;
    /** At 0.1s per frame, 1.6s / 0.1s = 16 frames minimum */
    for (let i = 0; i < 20 && !complete; i++) {
      complete = cmd.execute(camera, 0.1);
    }

    expect(complete).toBe(true);
  });

  it('camera looks toward planet center during transition', () => {
    const regionPos = new Vector3(130, 0, 0);
    const planetCenter = new Vector3(100, 0, 0);
    const cmd = new ZoomToRegionCommand(regionPos, planetCenter, 5, 'reg-1');
    const camera = makeCamera(new Vector3(100, 40, 0));

    cmd.execute(camera, 0.5);

    /** Camera should be looking roughly toward the planet center */
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    const toCenter = new Vector3()
      .subVectors(planetCenter, camera.position)
      .normalize();
    const dot = dir.dot(toCenter);
    expect(dot).toBeGreaterThan(0.5);
  });

  it('applyFollowDelta shifts positions after initialization', () => {
    const regionPos = new Vector3(130, 0, 0);
    const planetCenter = new Vector3(100, 0, 0);
    const cmd = new ZoomToRegionCommand(regionPos, planetCenter, 5, 'reg-1');
    const camera = makeCamera(new Vector3(100, 40, 0));

    cmd.execute(camera, 0.01);
    cmd.applyFollowDelta(new Vector3(10, 0, 0));

    /** Should not throw */
    cmd.execute(camera, 0.01);
  });
});

describe('ResetViewCommand', () => {
  it('has type reset-view', () => {
    const cmd = new ResetViewCommand();
    expect(cmd.type).toBe('reset-view');
  });

  it('moves camera toward default position', () => {
    const cmd = new ResetViewCommand();
    const camera = makeCamera(new Vector3(100, 50, 0));
    const startDist = camera.position.distanceTo(DEFAULT_CAMERA_POSITION);

    for (let i = 0; i < 100; i++) {
      cmd.execute(camera, 0.016);
    }

    const endDist = camera.position.distanceTo(DEFAULT_CAMERA_POSITION);
    expect(endDist).toBeLessThan(startDist);
  });

  it('completes when close to default position', () => {
    const nearDefault = DEFAULT_CAMERA_POSITION.clone().add(
      new Vector3(0.1, 0, 0),
    );
    const cmd = new ResetViewCommand();
    const camera = makeCamera(nearDefault);

    let complete = false;
    for (let i = 0; i < 500 && !complete; i++) {
      complete = cmd.execute(camera, 0.016);
    }

    expect(complete).toBe(true);
  });

  it('applyFollowDelta is a no-op', () => {
    const cmd = new ResetViewCommand();
    /** Should not throw */
    cmd.applyFollowDelta(new Vector3(10, 10, 10));
  });

  it('accepts custom default overrides', () => {
    const customPos = new Vector3(999, 0, 0);
    const customLook = new Vector3(0, 999, 0);
    const cmd = new ResetViewCommand(customPos, customLook);
    const camera = makeCamera(new Vector3(998.8, 0, 0));

    let complete = false;
    for (let i = 0; i < 500 && !complete; i++) {
      complete = cmd.execute(camera, 0.016);
    }

    expect(complete).toBe(true);
  });
});
