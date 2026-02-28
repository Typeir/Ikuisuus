/**
 * @fileoverview PlanetRenderer Unit Tests
 * @description Tests mesh creation, axial rotation update, and disposal.
 *
 * @module tests/unit/worldSim/celestials/PlanetRenderer
 */

import { PlanetRenderer } from '@/lib/components/worldSim/celestials/PlanetRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/lib/components/worldSim/celestials/interfaces';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow */
vi.mock('@/lib/components/worldSim/celestials/CelestialGlow', () => ({
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Mock atmosphere shaders */
vi.mock('@/lib/components/worldSim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() {}',
}));
vi.mock('@/lib/components/worldSim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() {}',
}));

/** Minimal planet body data */
const PLANET_DATA: CelestialBodyData = {
  id: 'damocles',
  name: 'Damocles',
  subtitle: 'The Bone World',
  loreOrigin: 'From the Golden One',
  type: 'planet',
  contentPath: 'world/damocles',
  orbit: {
    semiMajorAxis: 400,
    eccentricity: 0.02,
    inclination: 2,
    period: 100,
    phase: 0,
  },
  radius: 30,
  renderConfig: {
    renderer: 'planet',
    baseColor: '#4488cc',
    rotationSpeed: 0.05,
    atmosphereColor: '#6699ff',
    atmosphereIntensity: 1.5,
  },
  regions: [],
};

/** Create a minimal SceneContext */
function makeCtx(): SceneContext {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    time: 1.0,
    deltaTime: 0.016,
  };
}

describe('PlanetRenderer', () => {
  let renderer: PlanetRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a named group', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    expect(mesh.name).toBe('planet-damocles');
  });

  it('group contains planet-surface child', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface');
    expect(surface).toBeDefined();
  });

  it('group contains glow child', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const glow = mesh.children.find((c) => c.name === 'celestial-glow');
    expect(glow).toBeDefined();
  });

  it('creates atmosphere when atmosphereColor is set', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const atmo = mesh.children.find((c) => c.name === 'planet-atmosphere');
    expect(atmo).toBeDefined();
  });

  it('update rotates the surface mesh', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    const initialY = surface.rotation.y;

    renderer.update(mesh, 1.0, 0.1, makeCtx());
    expect(surface.rotation.y).not.toBe(initialY);
  });

  it('dispose does not throw', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });
});
