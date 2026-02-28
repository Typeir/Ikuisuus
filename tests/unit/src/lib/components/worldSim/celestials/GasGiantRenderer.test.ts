/**
 * @fileoverview GasGiantRenderer Unit Tests
 * @description Tests mesh creation, storm animation update, and disposal.
 *
 * @module tests/unit/worldSim/celestials/GasGiantRenderer
 */

import { GasGiantRenderer } from '@/lib/components/worldSim/celestials/GasGiantRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/lib/components/worldSim/celestials/interfaces';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow */
vi.mock('@/lib/components/worldSim/celestials/CelestialGlow', () => ({
  createRadialGradientTexture: () => ({ isTexture: true, dispose: vi.fn() }),
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Minimal gas giant data */
const GAS_GIANT_DATA: CelestialBodyData = {
  id: 'lansihenki',
  name: 'Länsihenkï',
  subtitle: 'Western Storm',
  loreOrigin: 'From the tempest',
  type: 'gasGiant',
  contentPath: 'world/lansihenki',
  orbit: {
    semiMajorAxis: 800,
    eccentricity: 0.05,
    inclination: 3,
    period: 200,
    phase: 0,
  },
  radius: 60,
  renderConfig: {
    renderer: 'gasGiant',
    baseColor: '#cc8844',
    bandColor: '#aa6633',
    rotationSpeed: 0.02,
    atmosphereColor: '#ffddaa',
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

describe('GasGiantRenderer', () => {
  let renderer: GasGiantRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a named group', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    expect(mesh.name).toBe('gasGiant-lansihenki');
  });

  it('group contains body, haze, and glow children', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const names = mesh.children.map((c) => c.name);
    expect(names).toContain('gasGiant-body');
    expect(names).toContain('gasGiant-haze');
    expect(names).toContain('celestial-glow');
  });

  it('update rotates the body mesh', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const body = mesh.children.find((c) => c.name === 'gasGiant-body')!;
    const initialY = body.rotation.y;

    renderer.update(mesh, 1.0, 0.5, makeCtx());
    expect(body.rotation.y).not.toBe(initialY);
  });

  it('dispose does not throw', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });
});
