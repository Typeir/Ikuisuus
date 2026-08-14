/**
 * @fileoverview Renderer Quality Optimization Tests
 * @description Tests setQualityLevel swaps LOD geometry and toggles child
 * visibility across celestial renderers.
 *
 * @module tests/unit/worldSim/optimization/RendererQuality.performance
 */

import { GasGiantRenderer } from '@/modules/world-sim/infrastructure/renderers/GasGiantRenderer';
import { PlanetRenderer } from '@/modules/world-sim/infrastructure/renderers/PlanetRenderer';
import { RingWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/RingWorldRenderer';
import { StarRenderer } from '@/modules/world-sim/infrastructure/renderers/StarRenderer';
import { TowerWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/TowerWorldRenderer';
import type { CelestialBodyData } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/modules/world-sim/shaders/star.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/star.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.frag.glsl', () => ({
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
