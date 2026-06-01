/**
 * @fileoverview PlanetRenderer Unit Tests
 * @description Tests mesh creation, axial rotation update, and disposal.
 *
 * @module tests/unit/worldSim/celestials/PlanetRenderer
 */

import { PlanetRenderer } from '@/modules/world-sim/infrastructure/renderers/PlanetRenderer';
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

/** Mock terrain shaders */
vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/modules/world-sim/shaders/planet.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
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

  it('surface uses ShaderMaterial for terrain displacement', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    expect((surface as any).material.type).toBe('ShaderMaterial');
  });

  it('terrain shader has 5 colour uniforms', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    const uniforms = (surface as any).material.uniforms;
    expect(uniforms.uColor0).toBeDefined();
    expect(uniforms.uColor1).toBeDefined();
    expect(uniforms.uColor2).toBeDefined();
    expect(uniforms.uColor3).toBeDefined();
    expect(uniforms.uColor4).toBeDefined();
  });

  it('terrain shader has two-tier noise uniforms', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    const uniforms = (surface as any).material.uniforms;
    expect(uniforms.uContinentScale).toBeDefined();
    expect(uniforms.uDetailScale).toBeDefined();
    expect(uniforms.uOceanThreshold).toBeDefined();
  });

  it('polar ice uniforms are set when polarIce config is true', () => {
    const polarData: CelestialBodyData = {
      ...PLANET_DATA,
      id: 'polar-planet',
      renderConfig: {
        renderer: 'planet',
        baseColor: '#4488cc',
        polarIce: true,
        polarLatitude: 0.72,
        iceColor: '#e4eef8',
      },
    };
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(polarData);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    const uniforms = (surface as any).material.uniforms;
    expect(uniforms.uPolarIce.value).toBe(1.0);
    expect(uniforms.uPolarLatitude.value).toBe(0.72);
  });

  it('polar ice defaults to off', () => {
    renderer = new PlanetRenderer();
    mesh = renderer.createMesh(PLANET_DATA);
    const surface = mesh.children.find((c) => c.name === 'planet-surface')!;
    const uniforms = (surface as any).material.uniforms;
    expect(uniforms.uPolarIce.value).toBe(0.0);
  });
});
