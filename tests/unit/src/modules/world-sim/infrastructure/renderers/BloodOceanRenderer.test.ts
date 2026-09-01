/**
 * @fileoverview BloodOceanRenderer Unit Tests
 * @description Tests mesh creation, ocean shell rotation update, time uniform
 * advancement, and resource disposal.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/renderers/BloodOceanRenderer.test
 */

import { BloodOceanRenderer } from '@/modules/world-sim/infrastructure/renderers/BloodOceanRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow */
vi.mock('@/modules/world-sim/infrastructure/effects/CelestialGlow', () => ({
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Mock atmosphere shaders */
vi.mock('@/modules/world-sim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() {}',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() {}',
}));

/** Mock blood ocean shaders */
vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/modules/world-sim/shaders/bloodOcean.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/bloodOcean.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Minimal blood ocean body data */
const URMELA_DATA: CelestialBodyData = {
  id: 'urmela',
  name: 'Urmela',
  subtitle: 'The Blood-Ocean',
  loreOrigin: "The Golden One's blood and entrails",
  type: 'planet',
  contentPath: 'world/the-lands-of-damocles/urmela',
  orbit: {
    semiMajorAxis: 650,
    eccentricity: 0.06,
    inclination: -5,
    period: 180,
    phase: 310,
  },
  radius: 41,
  renderConfig: {
    renderer: 'bloodOcean',
    coreColor: '#0d0002',
    oceanColor: '#5c0005',
    oceanHighlightColor: '#8b1515',
    coronaColor: '#660000',
    rotationSpeed: 0.0007,
    displacementScale: 2.0,
    noiseScale: 0.055,
    timeScale: 0.15,
    noiseSeed: 73,
    coreRadiusRatio: 0.72,
    oceanAlpha: 0.62,
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

describe('BloodOceanRenderer', () => {
  let renderer: BloodOceanRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a named group', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    expect(mesh.name).toBe('bloodOcean-urmela');
  });

  it('group contains bloodOcean-core child', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    const core = mesh.children.find((c) => c.name === 'bloodOcean-core');
    expect(core).toBeDefined();
  });

  it('group contains bloodOcean-shell child', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    const shell = mesh.children.find((c) => c.name === 'bloodOcean-shell');
    expect(shell).toBeDefined();
  });

  it('group contains bloodOcean-corona child', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    const corona = mesh.children.find((c) => c.name === 'bloodOcean-corona');
    expect(corona).toBeDefined();
  });

  it('group contains a glow child', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    const glow = mesh.children.find((c) => c.name === 'celestial-glow');
    expect(glow).toBeDefined();
  });

  it('update rotates the ocean shell', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    const shell = mesh.children.find((c) => c.name === 'bloodOcean-shell')!;
    const before = shell.rotation.y;
    renderer.update(mesh, 1.0, 0.016, makeCtx());
    expect(shell.rotation.y).toBeGreaterThan(before);
  });

  it('update advances uTime uniform on ocean material', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    renderer.update(mesh, 5.0, 0.016, makeCtx());
    const shell = mesh.children.find(
      (c) => c.name === 'bloodOcean-shell',
    ) as any;
    expect(shell.material.uniforms.uTime.value).toBe(5.0);
  });

  it('dispose clears all child resources without throwing', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });

  it('setQualityLevel low hides corona', () => {
    renderer = new BloodOceanRenderer();
    mesh = renderer.createMesh(URMELA_DATA);
    renderer.setQualityLevel!('low');
    const corona = mesh.children.find((c) => c.name === 'bloodOcean-corona')!;
    expect(corona.visible).toBe(false);
  });
});
