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

/** Mock gas giant shaders */
vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/lib/components/worldSim/shaders/gasGiant.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/gasGiant.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
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

  it('group contains cloud layers, haze, and glow children', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const names = mesh.children.map((c) => c.name);
    expect(names).toContain('gasGiant-cloud-0');
    expect(names).toContain('gasGiant-cloud-1');
    expect(names).toContain('gasGiant-haze');
    expect(names).toContain('celestial-glow');
  });

  it('update rotates the outermost cloud layer mesh', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const body = mesh.children.find((c) => c.name === 'gasGiant-cloud-0')!;
    const initialY = body.rotation.y;

    renderer.update(mesh, 1.0, 0.5, makeCtx());
    expect(body.rotation.y).not.toBe(initialY);
  });

  it('dispose does not throw', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });

  it('outermost cloud layer uses ShaderMaterial for cloud bands', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const body = mesh.children.find((c) => c.name === 'gasGiant-cloud-0')!;
    expect((body as any).material.type).toBe('ShaderMaterial');
  });

  it('update advances uTime uniform on both cloud layer shaders', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const cloud0 = mesh.children.find((c) => c.name === 'gasGiant-cloud-0')!;
    const cloud1 = mesh.children.find((c) => c.name === 'gasGiant-cloud-1')!;

    renderer.update(mesh, 7.5, 0.016, makeCtx());
    expect((cloud0 as any).material.uniforms.uTime.value).toBe(7.5);
    expect((cloud1 as any).material.uniforms.uTime.value).toBe(7.5);
  });

  it('overlay cloud layer is transparent with distinct band frequency', () => {
    renderer = new GasGiantRenderer();
    mesh = renderer.createMesh(GAS_GIANT_DATA);
    const cloud0 = mesh.children.find((c) => c.name === 'gasGiant-cloud-0')!;
    const cloud1 = mesh.children.find((c) => c.name === 'gasGiant-cloud-1')!;
    const mat0 = (cloud0 as any).material;
    const mat1 = (cloud1 as any).material;

    expect(mat0.transparent).toBe(false);
    expect(mat1.transparent).toBe(true);
    expect(mat1.uniforms.uBandFrequency.value).toBeGreaterThan(
      mat0.uniforms.uBandFrequency.value,
    );
  });
});
