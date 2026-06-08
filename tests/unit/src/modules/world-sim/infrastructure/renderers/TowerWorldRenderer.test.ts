/**
 * @fileoverview TowerWorldRenderer Unit Tests
 * @description Tests tower mesh creation with cylinder segments and orbiter pivots,
 * rotation behaviour, and disposal.
 *
 * @module tests/unit/worldSim/celestials/TowerWorldRenderer
 */

import { TowerWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/TowerWorldRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow to avoid canvas dependency */
vi.mock('@/modules/world-sim/infrastructure/effects/CelestialGlow', () => ({
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Mock tower shaders */
vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/modules/world-sim/shaders/tower.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Minimal tower world body data */
const TOWER_DATA: CelestialBodyData = {
  id: 'selkara',
  name: 'Selkara',
  subtitle: 'Tower of Marrow',
  loreOrigin: 'Test origin',
  type: 'towerWorld',
  contentPath: 'world/selkara',
  orbit: {
    semiMajorAxis: 400,
    eccentricity: 0,
    inclination: 0,
    period: 100,
    phase: 0,
  },
  radius: 20,
  renderConfig: {
    renderer: 'towerWorld',
    towerColor: '#bba44d',
    towerHeightMultiplier: 8,
    rotationSpeed: 0.03,
  },
  regions: [],
};

/** Build a minimal SceneContext */
function makeCtx(): SceneContext {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    time: 1.0,
    deltaTime: 0.016,
  };
}

describe('TowerWorldRenderer', () => {
  let renderer: TowerWorldRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a group named after the body', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    expect(mesh.name).toBe('towerWorld-selkara');
  });

  it('group contains 5 tower segments', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    const segments = mesh.children.filter((c) =>
      c.name.startsWith('tower-segment-'),
    );
    expect(segments.length).toBe(5);
  });

  it('group contains 10 orbiter pivots', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('orbiter-pivot-'),
    );
    expect(pivots.length).toBe(10);
  });

  it('update rotates the tower group and orbiter pivots', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);

    const pivot = mesh.children.find((c) => c.name === 'orbiter-pivot-0')!;
    const initialGroupY = mesh.rotation.y;
    const initialPivotY = pivot.rotation.y;

    renderer.update(mesh, 1.0, 0.5, makeCtx());

    expect(mesh.rotation.y).not.toBe(initialGroupY);
    expect(pivot.rotation.y).not.toBe(initialPivotY);
  });

  it('dispose does not throw', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });

  it('tower segments use ShaderMaterial for noise displacement', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    const segment = mesh.children.find(
      (c) => c.name === 'tower-segment-0',
    )!;
    expect((segment as any).material.type).toBe('ShaderMaterial');
  });

  it('update advances uTime uniform on tower materials', () => {
    renderer = new TowerWorldRenderer();
    mesh = renderer.createMesh(TOWER_DATA);
    const segment = mesh.children.find(
      (c) => c.name === 'tower-segment-0',
    )!;
    const material = (segment as any).material;

    renderer.update(mesh, 5.0, 0.016, makeCtx());
    expect(material.uniforms.uTime.value).toBe(5.0);
  });
});
