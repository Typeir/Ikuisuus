/**
 * @fileoverview CelestialSceneBuilder Unit Tests
 * @description Tests the pure scene-construction helpers extracted from
 * `WorldSimMediator`: body building, orbit lines, Everdark boundary, and
 * collision cloud assembly.
 *
 * @module tests/unit/worldSim/celestials/CelestialSceneBuilder
 */

import { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import {
    applyDefaultCulling,
    buildCelestialBodies,
    buildCollisionClouds,
    buildEverdark,
    buildOrbitLines,
} from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import { Mesh, Object3D, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/world-sim/infrastructure/effects/CelestialGlow', () => ({
  createRadialGradientTexture: () => ({ isTexture: true, dispose: vi.fn() }),
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '',
}));

describe('applyDefaultCulling', () => {
  it('sets frustumCulled on every descendant', () => {
    const root = new Object3D();
    const child = new Object3D();
    child.frustumCulled = false;
    root.add(child);
    applyDefaultCulling(root);
    expect(child.frustumCulled).toBe(true);
  });
});

describe('buildCelestialBodies', () => {
  it('returns one entry per registered body and adds meshes to the scene', () => {
    const registry = CelestialRegistry.shared();
    const scene = new Scene();
    const result = buildCelestialBodies(registry, scene);
    expect(result.size).toBe(registry.getAllBodies().length);
    result.forEach((entry) => {
      expect(scene.children).toContain(entry.mesh);
      expect(entry.mesh.userData.bodyId).toBe(entry.data.id);
    });
  });
});

describe('buildOrbitLines', () => {
  it('attaches orbit lines for top-level bodies to the scene root', () => {
    const registry = CelestialRegistry.shared();
    const scene = new Scene();
    const celestials = buildCelestialBodies(registry, scene);
    const lines = buildOrbitLines(registry, celestials, scene);
    lines.forEach((line, id) => {
      const body = registry.getBodyById(id);
      if (!body?.parentBodyId) {
        expect(scene.children).toContain(line);
      }
      expect(line).toBeInstanceOf(Mesh);
    });
  });
});

describe('buildEverdark', () => {
  it('returns a mesh and renderer pair, adding the mesh to the scene', () => {
    const registry = CelestialRegistry.shared();
    const scene = new Scene();
    const result = buildEverdark(registry, scene);
    expect(result.mesh).toBeDefined();
    expect(result.renderer).toBeDefined();
    expect(scene.children).toContain(result.mesh);
  });
});

describe('buildCollisionClouds', () => {
  it('returns an empty map when no pairs reference present bodies', () => {
    const scene = new Scene();
    const result = buildCollisionClouds(
      [{ id: 'missing-pair', bodyAId: 'nope-a', bodyBId: 'nope-b' }],
      new Map(),
      scene,
    );
    expect(result.size).toBe(0);
  });

  it('returns one effect per registered pair when both referenced bodies exist', () => {
    const registry = CelestialRegistry.shared();
    const scene = new Scene();
    const celestials = buildCelestialBodies(registry, scene);
    const pairs = registry.getCollisionPairs();
    const result = buildCollisionClouds(pairs, celestials, scene);
    expect(result.size).toBe(pairs.length);
    for (const pair of pairs) {
      const entry = result.get(pair.id);
      expect(entry).toBeDefined();
      expect(entry!.pair.id).toBe(pair.id);
    }
  });
});
