/**
 * @fileoverview CelestialSceneBuilder Unit Tests
 * @description Tests the pure scene-construction helpers extracted from
 * `WorldSimMediator`: body building, orbit lines, Everdark boundary, and
 * collision cloud assembly.
 *
 * @module tests/unit/worldSim/celestials/CelestialSceneBuilder
 */

import {
  applyDefaultCulling,
  buildCelestialBodies,
  buildCollisionCloud,
  buildEverdark,
  buildOrbitLines,
} from '@/lib/components/worldSim/celestials/CelestialSceneBuilder';
import { CelestialRegistry } from '@/lib/components/worldSim/celestials/CelestialRegistry';
import { Mesh, Object3D, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/worldSim/celestials/CelestialGlow', () => ({
  createRadialGradientTexture: () => ({ isTexture: true, dispose: vi.fn() }),
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
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

describe('buildCollisionCloud', () => {
  it('returns null when required bodies are absent', () => {
    const scene = new Scene();
    const result = buildCollisionCloud(new Map(), scene);
    expect(result).toBeNull();
  });

  it('returns a CollisionCloudEffect when both Henki bodies are present', () => {
    const registry = CelestialRegistry.shared();
    const scene = new Scene();
    const celestials = buildCelestialBodies(registry, scene);
    const result = buildCollisionCloud(celestials, scene);
    expect(result).not.toBeNull();
  });
});
