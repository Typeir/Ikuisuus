/**
 * @fileoverview Renderer Quality Optimization Tests
 * @description Validates adaptive quality degradation behavior across celestial
 * renderers (shader detail reduction, optional effect disabling, and
 * optimization-friendly culling flags).
 *
 * @module tests/unit/worldSim/optimization/RendererQuality.performance
 */

import { GasGiantRenderer } from '@/lib/components/worldSim/celestials/GasGiantRenderer';
import { PlanetRenderer } from '@/lib/components/worldSim/celestials/PlanetRenderer';
import { RingWorldRenderer } from '@/lib/components/worldSim/celestials/RingWorldRenderer';
import { StarRenderer } from '@/lib/components/worldSim/celestials/StarRenderer';
import { TowerWorldRenderer } from '@/lib/components/worldSim/celestials/TowerWorldRenderer';
import type { CelestialBodyData } from '@/lib/components/worldSim/celestials/interfaces';
import { Object3D } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/lib/components/worldSim/shaders/star.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/star.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/planet.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/planet.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/gasGiant.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/gasGiant.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/ringWorld.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/ringWorld.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/icyCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/icyCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/tower.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/tower.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

const STAR_DATA: CelestialBodyData = {
  id: 'star-test',
  name: 'Star Test',
  subtitle: 'perf',
  loreOrigin: 'test',
  type: 'star',
  contentPath: 'world/star',
  orbit: null,
  radius: 50,
  renderConfig: {
    renderer: 'star',
    emissiveColor: '#ffcc44',
    coronaColor: '#ff8800',
  },
  regions: [],
};

const PLANET_DATA: CelestialBodyData = {
  id: 'planet-test',
  name: 'Planet Test',
  subtitle: 'perf',
  loreOrigin: 'test',
  type: 'planet',
  contentPath: 'world/planet',
  orbit: {
    semiMajorAxis: 100,
    eccentricity: 0,
    inclination: 0,
    period: 10,
    phase: 0,
  },
  radius: 25,
  renderConfig: {
    renderer: 'planet',
    baseColor: '#4488cc',
    atmosphereColor: '#6699ff',
  },
  regions: [],
};

const GAS_DATA: CelestialBodyData = {
  id: 'gas-test',
  name: 'Gas Test',
  subtitle: 'perf',
  loreOrigin: 'test',
  type: 'gasGiant',
  contentPath: 'world/gas',
  orbit: {
    semiMajorAxis: 200,
    eccentricity: 0,
    inclination: 0,
    period: 10,
    phase: 0,
  },
  radius: 30,
  renderConfig: {
    renderer: 'gasGiant',
    baseColor: '#cc8844',
    bandColor: '#aa6633',
    atmosphereColor: '#ffddaa',
  },
  regions: [],
};

const RING_DATA: CelestialBodyData = {
  id: 'ring-test',
  name: 'Ring Test',
  subtitle: 'perf',
  loreOrigin: 'test',
  type: 'ringWorld',
  contentPath: 'world/ring',
  orbit: {
    semiMajorAxis: 150,
    eccentricity: 0,
    inclination: 0,
    period: 10,
    phase: 0,
  },
  radius: 20,
  renderConfig: {
    renderer: 'ringWorld',
    coreColor: '#c8dde8',
    ringColor: '#9ab8d0',
    ringCount: 2,
    icyCore: true,
  },
  regions: [],
};

const TOWER_DATA: CelestialBodyData = {
  id: 'tower-test',
  name: 'Tower Test',
  subtitle: 'perf',
  loreOrigin: 'test',
  type: 'towerWorld',
  contentPath: 'world/tower',
  orbit: {
    semiMajorAxis: 180,
    eccentricity: 0,
    inclination: 0,
    period: 10,
    phase: 0,
  },
  radius: 20,
  renderConfig: {
    renderer: 'towerWorld',
    towerColor: '#aaaaaa',
  },
  regions: [],
};

describe('Renderer adaptive optimization behavior', () => {
  const trackedMeshes: Array<{ renderer: { dispose: (mesh: Object3D) => void }; mesh: Object3D }> = [];

  afterEach(() => {
    for (const entry of trackedMeshes) {
      entry.renderer.dispose(entry.mesh);
    }
    trackedMeshes.length = 0;
  });

  it('StarRenderer lowers shader detail and swaps LOD geometry in low quality', () => {
    const renderer = new StarRenderer();
    const mesh = renderer.createMesh(STAR_DATA);
    trackedMeshes.push({ renderer, mesh });

    const core = mesh.children.find((c) => c.name === 'star-core') as any;

    expect(core.material.uniforms.uDetailLevel.value).toBe(2);
    const highGeometry = core.geometry;

    renderer.setQualityLevel?.('low');
    expect(core.material.uniforms.uDetailLevel.value).toBe(0);
    expect(core.geometry).not.toBe(highGeometry);

    renderer.setQualityLevel?.('high');
    expect(core.material.uniforms.uDetailLevel.value).toBe(2);
    expect(core.geometry).toBe(highGeometry);
  });

  it('PlanetRenderer degrades shader detail, swaps LOD geometry and hides atmosphere at low quality', () => {
    const renderer = new PlanetRenderer();
    const mesh = renderer.createMesh(PLANET_DATA);
    trackedMeshes.push({ renderer, mesh });

    const surface = mesh.children.find((c) => c.name === 'planet-surface') as any;
    const atmosphere = mesh.children.find((c) => c.name === 'planet-atmosphere') as any;

    expect(surface.material.uniforms.uDetailLevel.value).toBe(2);
    const highGeometry = surface.geometry;

    renderer.setQualityLevel?.('low');
    expect(surface.material.uniforms.uDetailLevel.value).toBe(0);
    expect(atmosphere.visible).toBe(false);
    expect(surface.geometry).not.toBe(highGeometry);

    renderer.setQualityLevel?.('medium');
    expect(surface.material.uniforms.uDetailLevel.value).toBe(1);
    expect(atmosphere.visible).toBe(true);
  });

  it('GasGiantRenderer reduces cloud detail, hides overlay and haze at low quality', () => {
    const renderer = new GasGiantRenderer();
    const mesh = renderer.createMesh(GAS_DATA);
    trackedMeshes.push({ renderer, mesh });

    const cloud0 = mesh.children.find((c) => c.name === 'gasGiant-cloud-0') as any;
    const cloud1 = mesh.children.find((c) => c.name === 'gasGiant-cloud-1') as any;
    const haze = mesh.children.find((c) => c.name === 'gasGiant-haze') as any;

    expect(cloud0.material.uniforms.uDetailLevel.value).toBe(2);
    expect(cloud1.material.uniforms.uDetailLevel.value).toBe(2);

    renderer.setQualityLevel?.('low');
    expect(cloud0.material.uniforms.uDetailLevel.value).toBe(0);
    expect(cloud1.material.uniforms.uDetailLevel.value).toBe(0);
    expect(cloud1.visible).toBe(false);
    expect(haze.visible).toBe(false);

    renderer.setQualityLevel?.('high');
    expect(cloud0.material.uniforms.uDetailLevel.value).toBe(2);
    expect(cloud1.material.uniforms.uDetailLevel.value).toBe(2);
    expect(cloud1.visible).toBe(true);
    expect(haze.visible).toBe(true);
  });

  it('RingWorldRenderer applies quality detail to icy core and ring materials, hides rings at low', () => {
    const renderer = new RingWorldRenderer();
    const mesh = renderer.createMesh(RING_DATA);
    trackedMeshes.push({ renderer, mesh });

    const core = mesh.children.find((c) => c.name === 'ring-core') as any;
    const ring = mesh.children
      .flatMap((c) => c.children)
      .find((c) => c.name === 'ring-0') as any;

    expect(core.material.uniforms.uDetailLevel.value).toBe(2);
    expect(ring.material.uniforms.uDetailLevel.value).toBe(2);

    renderer.setQualityLevel?.('medium');
    expect(core.material.uniforms.uDetailLevel.value).toBe(1);
    expect(ring.material.uniforms.uDetailLevel.value).toBe(1);

    renderer.setQualityLevel?.('low');
    expect(core.material.uniforms.uDetailLevel.value).toBe(0);
    expect(ring.material.uniforms.uDetailLevel.value).toBe(0);

    const pivots = mesh.children.filter((c) => c.name.startsWith('ring-pivot-'));
    const visibleCount = pivots.filter((p) => p.visible).length;
    expect(visibleCount).toBe(Math.min(2, 3));
  });

  it('TowerWorldRenderer reduces tower segment detail and hides orbiters at low quality', () => {
    const renderer = new TowerWorldRenderer();
    const mesh = renderer.createMesh(TOWER_DATA);
    trackedMeshes.push({ renderer, mesh });

    const segment = mesh.children.find((c) => c.name === 'tower-segment-0') as any;

    expect(segment.material.uniforms.uDetailLevel.value).toBe(2);

    renderer.setQualityLevel?.('low');
    expect(segment.material.uniforms.uDetailLevel.value).toBe(0);

    const pivots = mesh.children.filter((c) => c.name.startsWith('orbiter-pivot-'));
    const visibleCount = pivots.filter((p) => p.visible).length;
    expect(visibleCount).toBe(3);

    renderer.setQualityLevel?.('high');
    expect(segment.material.uniforms.uDetailLevel.value).toBe(2);
    const visibleCountHigh = pivots.filter((p) => p.visible).length;
    expect(visibleCountHigh).toBe(10);
  });
});
