/**
 * @fileoverview Geometry LOD Integration Tests
 * @description Verifies that renderers correctly swap geometry when quality
 * level changes, that segment counts are within budget at each tier, and
 * that draw-call reduction (hiding meshes) works for ring/tower worlds.
 *
 * @module tests/unit/worldSim/optimization/GeometryLOD
 */

import { EverdarkRenderer } from '@/modules/world-sim/infrastructure/renderers/EverdarkRenderer';
import { GasGiantRenderer } from '@/modules/world-sim/infrastructure/renderers/GasGiantRenderer';
import { PlanetRenderer } from '@/modules/world-sim/infrastructure/renderers/PlanetRenderer';
import { RingWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/RingWorldRenderer';
import { StarRenderer } from '@/modules/world-sim/infrastructure/renderers/StarRenderer';
import { TowerWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/TowerWorldRenderer';
import type {
    BoundaryData,
    CelestialBodyData,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { SPHERE_LOD } from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import { Object3D, SphereGeometry } from 'three';
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
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/star.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/everdark.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/everdark.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1); }',
}));

const STAR_DATA: CelestialBodyData = {
  id: 'lod-star',
  name: 'LOD Star',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'star',
  contentPath: 'world/star',
  orbit: null,
  radius: 100,
  renderConfig: {
    renderer: 'star',
    emissiveColor: '#ff0',
    coronaColor: '#f80',
  },
  regions: [],
};

const PLANET_DATA: CelestialBodyData = {
  id: 'lod-planet',
  name: 'LOD Planet',
  subtitle: 'test',
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
  radius: 20,
  renderConfig: {
    renderer: 'planet',
    baseColor: '#44aa44',
    atmosphereColor: '#88ccff',
  },
  regions: [],
};

const GAS_DATA: CelestialBodyData = {
  id: 'lod-gas',
  name: 'LOD GasGiant',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'gasGiant',
  contentPath: 'world/gas',
  orbit: {
    semiMajorAxis: 200,
    eccentricity: 0,
    inclination: 0,
    period: 50,
    phase: 0,
  },
  radius: 40,
  renderConfig: {
    renderer: 'gasGiant',
    baseColor: '#cc8844',
    bandColor: '#aa6633',
  },
  regions: [],
};

const EVERDARK_DATA: BoundaryData = {
  id: 'lod-everdark',
  name: 'LOD Everdark',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'boundary',
  contentPath: 'world/everdark',
  radius: 2000,
  renderConfig: { renderer: 'everdark' },
  regions: [],
};

const RING_DATA: CelestialBodyData = {
  id: 'lod-ring',
  name: 'LOD Ring',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'ringWorld',
  contentPath: 'world/ring',
  orbit: {
    semiMajorAxis: 300,
    eccentricity: 0,
    inclination: 0,
    period: 100,
    phase: 0,
  },
  radius: 30,
  renderConfig: {
    renderer: 'ringWorld',
    coreColor: '#c8dde8',
    ringColor: '#9ab8d0',
    ringCount: 7,
    icyCore: true,
  },
  regions: [],
};

const TOWER_DATA: CelestialBodyData = {
  id: 'lod-tower',
  name: 'LOD Tower',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'towerWorld',
  contentPath: 'world/tower',
  orbit: {
    semiMajorAxis: 150,
    eccentricity: 0,
    inclination: 0,
    period: 80,
    phase: 0,
  },
  radius: 15,
  renderConfig: { renderer: 'towerWorld', towerColor: '#aaa' },
  regions: [],
};

/**
 * Count the number of vertices on a SphereGeometry by inspecting parameters.
 */
function sphereVertexCount(geo: SphereGeometry): number {
  const w = geo.parameters.widthSegments;
  const h = geo.parameters.heightSegments;
  return (w + 1) * (h + 1);
}

describe('Geometry LOD system', () => {
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

  it('StarRenderer high tier uses budget segments (32×32), not legacy (64×64)', () => {
    const renderer = new StarRenderer();
    const mesh = renderer.createMesh(STAR_DATA);
    trackedMeshes.push({ renderer, mesh });

    const core = mesh.children.find((c) => c.name === 'star-core') as any;
    const geo = core.geometry as SphereGeometry;

    expect(geo.parameters.widthSegments).toBe(SPHERE_LOD.high);
    expect(geo.parameters.heightSegments).toBe(SPHERE_LOD.high);
    expect(sphereVertexCount(geo)).toBeLessThan(2200);
  });

  it('StarRenderer swaps geometry correctly through all 3 LOD tiers', () => {
    const renderer = new StarRenderer();
    const mesh = renderer.createMesh(STAR_DATA);
    trackedMeshes.push({ renderer, mesh });

    const core = mesh.children.find((c) => c.name === 'star-core') as any;
    const highGeo = core.geometry as SphereGeometry;
    expect(highGeo.parameters.widthSegments).toBe(32);

    renderer.setQualityLevel?.('medium');
    const medGeo = core.geometry as SphereGeometry;
    expect(medGeo.parameters.widthSegments).toBe(16);
    expect(medGeo).not.toBe(highGeo);

    renderer.setQualityLevel?.('low');
    const lowGeo = core.geometry as SphereGeometry;
    expect(lowGeo.parameters.widthSegments).toBe(8);
    expect(lowGeo).not.toBe(medGeo);

    renderer.setQualityLevel?.('high');
    expect(core.geometry).toBe(highGeo);
  });

  it('PlanetRenderer surface and atmosphere get LOD-appropriate geometry', () => {
    const renderer = new PlanetRenderer();
    const mesh = renderer.createMesh(PLANET_DATA);
    trackedMeshes.push({ renderer, mesh });

    const surface = mesh.children.find(
      (c) => c.name === 'planet-surface',
    ) as any;
    const atmo = mesh.children.find(
      (c) => c.name === 'planet-atmosphere',
    ) as any;

    expect(surface.geometry.parameters.widthSegments).toBe(32);
    expect(atmo.geometry.parameters.widthSegments).toBe(16);

    renderer.setQualityLevel?.('low');
    expect(surface.geometry.parameters.widthSegments).toBe(8);
    expect(atmo.geometry.parameters.widthSegments).toBe(8);
    expect(atmo.visible).toBe(false);
  });

  it('GasGiantRenderer uses reduced segment counts and hides overlay at low', () => {
    const renderer = new GasGiantRenderer();
    const mesh = renderer.createMesh(GAS_DATA);
    trackedMeshes.push({ renderer, mesh });

    const cloud0 = mesh.children.find(
      (c) => c.name === 'gasGiant-cloud-0',
    ) as any;
    const cloud1 = mesh.children.find(
      (c) => c.name === 'gasGiant-cloud-1',
    ) as any;

    expect(cloud0.geometry.parameters.widthSegments).toBe(24);
    expect(cloud1.geometry.parameters.widthSegments).toBe(16);

    renderer.setQualityLevel?.('low');
    expect(cloud0.geometry.parameters.widthSegments).toBe(12);
    expect(cloud1.visible).toBe(false);

    renderer.setQualityLevel?.('high');
    expect(cloud0.geometry.parameters.widthSegments).toBe(24);
    expect(cloud1.visible).toBe(true);
  });

  it('EverdarkRenderer swaps shell geometry across LOD tiers', () => {
    const renderer = new EverdarkRenderer();
    const mesh = renderer.createMesh(EVERDARK_DATA);
    trackedMeshes.push({ renderer, mesh });

    const shells = mesh.children.filter((c) =>
      c.name.startsWith('everdark-shell-'),
    );
    expect(shells.length).toBe(3);

    const outerGeo = (shells[0] as any).geometry as SphereGeometry;
    expect(outerGeo.parameters.widthSegments).toBe(32);

    renderer.setQualityLevel?.('low');
    const lowOuterGeo = (shells[0] as any).geometry as SphereGeometry;
    expect(lowOuterGeo.parameters.widthSegments).toBe(12);
    expect(shells[2].visible).toBe(false);

    renderer.setQualityLevel?.('high');
    expect((shells[0] as any).geometry).toBe(outerGeo);
    expect(shells[2].visible).toBe(true);
  });

  it('RingWorldRenderer hides rings beyond visibility budget at low quality', () => {
    const renderer = new RingWorldRenderer();
    const mesh = renderer.createMesh(RING_DATA);
    trackedMeshes.push({ renderer, mesh });

    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('ring-pivot-'),
    );
    expect(pivots.length).toBe(7);

    renderer.setQualityLevel?.('low');
    const visibleLow = pivots.filter((p) => p.visible).length;
    expect(visibleLow).toBe(3);

    renderer.setQualityLevel?.('medium');
    const visibleMed = pivots.filter((p) => p.visible).length;
    expect(visibleMed).toBe(5);

    renderer.setQualityLevel?.('high');
    const visibleHigh = pivots.filter((p) => p.visible).length;
    expect(visibleHigh).toBe(7);
  });

  it('TowerWorldRenderer hides orbiters beyond visibility budget at low quality', () => {
    const renderer = new TowerWorldRenderer();
    const mesh = renderer.createMesh(TOWER_DATA);
    trackedMeshes.push({ renderer, mesh });

    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('orbiter-pivot-'),
    );
    expect(pivots.length).toBe(10);

    renderer.setQualityLevel?.('low');
    const visibleLow = pivots.filter((p) => p.visible).length;
    expect(visibleLow).toBe(3);

    renderer.setQualityLevel?.('medium');
    const visibleMed = pivots.filter((p) => p.visible).length;
    expect(visibleMed).toBe(6);

    renderer.setQualityLevel?.('high');
    const visibleHigh = pivots.filter((p) => p.visible).length;
    expect(visibleHigh).toBe(10);
  });

  it('total scene vertex budget at high tier is under 25000', () => {
    const star = new StarRenderer();
    const starMesh = star.createMesh(STAR_DATA);
    trackedMeshes.push({ renderer: star, mesh: starMesh });

    const planet = new PlanetRenderer();
    const planetMesh = planet.createMesh(PLANET_DATA);
    trackedMeshes.push({ renderer: planet, mesh: planetMesh });

    const gas = new GasGiantRenderer();
    const gasMesh = gas.createMesh(GAS_DATA);
    trackedMeshes.push({ renderer: gas, mesh: gasMesh });

    let totalVertices = 0;
    for (const root of [starMesh, planetMesh, gasMesh]) {
      root.traverse((child) => {
        const geo = (child as any).geometry;
        if (geo?.parameters?.widthSegments != null) {
          totalVertices += sphereVertexCount(geo);
        }
      });
    }

    expect(totalVertices).toBeLessThan(25000);
  });
});
