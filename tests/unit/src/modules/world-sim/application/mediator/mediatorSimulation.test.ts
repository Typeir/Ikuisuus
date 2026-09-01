/**
 * @fileoverview Unit tests for mediatorSimulation helpers
 * @description Tests for runCelestialSimulation, runEverdarkSimulation, and runCollisionSimulation.
 *
 * @module tests/unit/src/modules/world-sim/application/mediator/mediatorSimulation.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    runCelestialSimulation,
    runCollisionSimulation,
    runEverdarkSimulation,
} from '@/modules/world-sim/application/mediator/mediatorSimulation';
import type {
    ICelestialRenderer,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import type {
    CelestialEntry,
    CollisionCloudEntry,
} from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/world-sim/domain/celestials/orbitalMechanics', () => ({
  computeOrbitalPosition: vi.fn(() => ({ x: 10, y: 0, z: 0 })),
}));

/** Build a minimal CelestialEntry mock. */
function makeCelestialEntry(id: string, parentBodyId?: string): CelestialEntry {
  return {
    data: {
      id,
      radius: 5,
      orbit: parentBodyId
        ? undefined
        : {
            semiMajorAxis: 10,
            eccentricity: 0,
            inclination: 0,
            period: 100,
            phase: 0,
          },
      parentBodyId,
    },
    mesh: {
      position: {
        copy: vi.fn().mockReturnThis(),
        add: vi.fn().mockReturnThis(),
      },
    },
    renderer: { update: vi.fn(), dispose: vi.fn() },
  } as unknown as CelestialEntry;
}

/** Minimal SceneContext mock. */
const ctx = {
  camera: {},
  scene: {},
  time: 1,
  deltaTime: 0.016,
} as unknown as SceneContext;

describe('runCelestialSimulation', () => {
  it('calls renderer.update for each celestial', () => {
    const entry = makeCelestialEntry('sol');
    const celestials = new Map([['sol', entry]]);

    runCelestialSimulation(celestials, ctx, 1, 0.016);

    expect(entry.renderer.update).toHaveBeenCalledOnce();
  });

  it('positions a child body relative to its parent', () => {
    const parent = makeCelestialEntry('sol');
    const child = makeCelestialEntry('planet', 'sol');
    const celestials = new Map([
      ['sol', parent],
      ['planet', child],
    ]);

    runCelestialSimulation(celestials, ctx, 1, 0.016);

    expect(child.mesh.position.copy).toHaveBeenCalledWith(parent.mesh.position);
  });
});

describe('runEverdarkSimulation', () => {
  it('calls update when both renderer and mesh are present', () => {
    const renderer = { update: vi.fn() } as unknown as ICelestialRenderer;
    const mesh = {} as unknown as import('three').Object3D;

    runEverdarkSimulation(renderer, mesh, ctx, 1, 0.016);

    expect(renderer.update).toHaveBeenCalledWith(mesh, 1, 0.016, ctx);
  });

  it('does nothing when renderer is null', () => {
    expect(() =>
      runEverdarkSimulation(null, null, ctx, 1, 0.016),
    ).not.toThrow();
  });
});

describe('runCollisionSimulation', () => {
  it('returns early when map is empty', () => {
    expect(() =>
      runCollisionSimulation(new Map(), new Map(), 1, 0.016),
    ).not.toThrow();
  });

  it('calls effect.update with correct positions when both bodies are found', () => {
    const bodyA = makeCelestialEntry('bodyA');
    const bodyB = makeCelestialEntry('bodyB');
    const celestials = new Map([
      ['bodyA', bodyA],
      ['bodyB', bodyB],
    ]);

    const effect = { update: vi.fn() };
    const pair = { bodyAId: 'bodyA', bodyBId: 'bodyB' };
    const clouds = new Map([
      ['pair1', { pair, effect } as unknown as CollisionCloudEntry],
    ]);

    runCollisionSimulation(clouds, celestials, 1, 0.016);

    expect(effect.update).toHaveBeenCalledOnce();
  });
});
