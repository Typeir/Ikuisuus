/**
 * @fileoverview Unit tests for mediatorNavigation helpers
 * @description Tests for zoomToBodyImpl, zoomToRegionImpl, and zoomToLocalCoordinateImpl.
 *
 * @module tests/unit/src/modules/world-sim/application/mediator/mediatorNavigation
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    zoomToBodyImpl,
    zoomToLocalCoordinateImpl,
    zoomToRegionImpl,
} from '@/modules/world-sim/application/mediator/mediatorNavigation';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import type { CelestialEntry } from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/world-sim/application/commands/CameraCommand', () => ({
  ZoomToBodyCommand: vi.fn().mockImplementation(function (
    pos: unknown,
    dist: unknown,
    id: unknown,
  ) {
    return { pos, dist, id };
  }),
  ZoomToRegionCommand: vi.fn().mockImplementation(function (
    pos: unknown,
    parent: unknown,
    dist: unknown,
    id: unknown,
  ) {
    return { pos, parent, dist, id };
  }),
}));

vi.mock('@/modules/world-sim/domain/celestials/orbitalMechanics', () => ({
  surfacePositionToWorld: vi.fn(() => ({ x: 1, y: 0, z: 0 })),
}));

vi.mock('@/modules/world-sim/infrastructure/config/sceneTuning', () => ({
  LOCAL_COORD_VIEW_DISTANCE: 50,
  REGION_VIEW_DISTANCE: 80,
  VIEW_DISTANCE_MULTIPLIER: 3,
}));

/** Build a minimal CelestialEntry mock. */
function makeEntry(): CelestialEntry {
  return {
    data: { id: 'testBody', radius: 10 },
    mesh: { position: { clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })) } },
    renderer: { update: vi.fn(), dispose: vi.fn() },
  } as unknown as CelestialEntry;
}

/** Build a minimal CameraController mock. */
function makeCameraController() {
  return { setFollowTarget: vi.fn(), executeCommand: vi.fn() };
}

/** Build a minimal CelestialRegistry mock. */
function makeRegistry(region?: {
  surfacePosition: { lat: number; lon: number };
}) {
  return {
    getRegion: vi.fn(() => region ?? { surfacePosition: { lat: 0, lon: 0 } }),
  };
}

describe('zoomToBodyImpl', () => {
  it('dispatches SelectBody and executes a camera command', () => {
    const entry = makeEntry();
    const celestials = new Map([['testBody', entry]]);
    const controller = makeCameraController();
    const dispatch = vi.fn();
    const setFollowed = vi.fn();

    zoomToBodyImpl(
      'testBody',
      celestials,
      controller as never,
      dispatch,
      setFollowed,
    );

    expect(setFollowed).toHaveBeenCalledWith('testBody');
    expect(controller.executeCommand).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.SelectBody,
      bodyId: 'testBody',
    });
  });

  it('does nothing when body is not found', () => {
    const dispatch = vi.fn();
    zoomToBodyImpl(
      'missing',
      new Map(),
      makeCameraController() as never,
      dispatch,
      vi.fn(),
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('zoomToRegionImpl', () => {
  it('dispatches SelectRegion and executes a camera command', () => {
    const entry = makeEntry();
    const celestials = new Map([['testBody', entry]]);
    const controller = makeCameraController();
    const dispatch = vi.fn();
    const registry = makeRegistry();

    zoomToRegionImpl(
      'testBody',
      'reg1',
      celestials,
      registry as never,
      controller as never,
      dispatch,
      vi.fn(),
    );

    expect(controller.executeCommand).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.SelectRegion,
      regionId: 'reg1',
      bodyId: 'testBody',
    });
  });
});

describe('zoomToLocalCoordinateImpl', () => {
  it('dispatches SelectBody and executes a camera command', () => {
    const entry = makeEntry();
    const celestials = new Map([['testBody', entry]]);
    const controller = makeCameraController();
    const dispatch = vi.fn();

    zoomToLocalCoordinateImpl(
      'testBody',
      { lat: 10, lon: 20 },
      undefined,
      celestials,
      controller as never,
      dispatch,
      vi.fn(),
    );

    expect(controller.executeCommand).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.SelectBody,
      bodyId: 'testBody',
    });
  });
});
