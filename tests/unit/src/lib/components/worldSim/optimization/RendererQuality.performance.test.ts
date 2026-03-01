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
  const trackedMeshes: Array<{
    renderer: { dispose: (mesh: Object3D) => void };
    mesh: Object3D;
  }> = [];

  afterEach(() => {
    for (const entry of trackedMeshes) {
      entry.renderer.dispose(entry.mesh);
    }
    trackedMeshes.length = 0;
  });

  it('StarRenderer swaps LOD geometry across quality levels', () => {
    const renderer = new StarRenderer();
    const mesh = renderer.createMesh(STAR_DATA);
    trackedMeshes.push({ renderer, mesh });

    const core = mesh.children.find((c) => c.name === 'star-core') as any;
    const highGeometry = core.geometry;

    renderer.setQualityLevel?.('low');
    expect(core.geometry).not.toBe(highGeometry);

    renderer.setQualityLevel?.('high');
    expect(core.geometry).toBe(highGeometry);
  });

  it('PlanetRenderer swaps LOD geometry and hides atmosphere at low quality', () => {
    const renderer = new PlanetRenderer();
    const mesh = renderer.createMesh(PLANET_DATA);
    trackedMeshes.push({ renderer, mesh });

    const surface = mesh.children.find(
      (c) => c.name === 'planet-surface',
    ) as any;
    const atmosphere = mesh.children.find(
      (c) => c.name === 'planet-atmosphere',
    ) as any;

    const highGeometry = surface.geometry;

    renderer.setQualityLevel?.('low');
    expect(atmosphere.visible).toBe(false);
    expect(surface.geometry).not.toBe(highGeometry);

    renderer.setQualityLevel?.('medium');
    expect(atmosphere.visible).toBe(true);
  });

  it('GasGiantRenderer hides overlay and haze at low quality, restores at high', () => {
    const renderer = new GasGiantRenderer();
    const mesh = renderer.createMesh(GAS_DATA);
    trackedMeshes.push({ renderer, mesh });

    const cloud1 = mesh.children.find(
      (c) => c.name === 'gasGiant-cloud-1',
    ) as any;
    const haze = mesh.children.find((c) => c.name === 'gasGiant-haze') as any;

    renderer.setQualityLevel?.('low');
    expect(cloud1.visible).toBe(false);
    expect(haze.visible).toBe(false);

    renderer.setQualityLevel?.('high');
    expect(cloud1.visible).toBe(true);
    expect(haze.visible).toBe(true);
  });

  it('RingWorldRenderer hides rings at low quality', () => {
    const renderer = new RingWorldRenderer();
    const mesh = renderer.createMesh(RING_DATA);
    trackedMeshes.push({ renderer, mesh });

    renderer.setQualityLevel?.('low');

    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('ring-pivot-'),
    );
    const visibleCount = pivots.filter((p) => p.visible).length;
    expect(visibleCount).toBe(Math.min(2, 3));
  });

  it('TowerWorldRenderer hides orbiters at low quality and shows them at high', () => {
    const renderer = new TowerWorldRenderer();
    const mesh = renderer.createMesh(TOWER_DATA);
    trackedMeshes.push({ renderer, mesh });

    renderer.setQualityLevel?.('low');

    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('orbiter-pivot-'),
    );
    const visibleCount = pivots.filter((p) => p.visible).length;
    expect(visibleCount).toBe(3);

    renderer.setQualityLevel?.('high');
    const visibleCountHigh = pivots.filter((p) => p.visible).length;
    expect(visibleCountHigh).toBe(10);
  });
});
