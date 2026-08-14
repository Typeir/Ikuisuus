/**
 * @fileoverview Verifies celestials public types/interfaces are importable.
 * @description Verifies all public types and interfaces can be used in structural type assertions.
 * @module tests/unit/worldSim/celestials/interfaces
 */

import type {
    BoundaryData,
    CelestialBodyData,
    CelestialBodyType,
    CelestialRegion,
    CelestialRendererType,
    OrbitalParameters,
    ProjectedPosition,
    RenderConfig
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { describe, expect, it } from 'vitest';

describe('interfaces', () => {
  it('CelestialBodyData satisfies structural contract', () => {
    const data: CelestialBodyData = {
      id: 'test',
      name: 'Test',
      subtitle: 'Sub',
      loreOrigin: 'Lore',
      type: 'planet',
      contentPath: 'world/test',
      orbit: {
        semiMajorAxis: 100,
        eccentricity: 0,
        inclination: 0,
        period: 10,
        phase: 0,
      },
      radius: 5,
      renderConfig: { renderer: 'planet' },
      regions: [],
    };
    expect(data.id).toBe('test');
    expect(data.type).toBe('planet');
    expect(data.regions).toEqual([]);
  });

  it('CelestialRegion satisfies structural contract', () => {
    const region: CelestialRegion = {
      id: 'reg',
      name: 'Region',
      contentPath: 'world/planet/reg',
      surfacePosition: { lat: 10, lon: 20 },
      areaScale: 0.5,
    };
    expect(region.surfacePosition.lat).toBe(10);
    expect(region.areaScale).toBe(0.5);
  });

  it('ProjectedPosition satisfies structural contract', () => {
    const pos: ProjectedPosition = {
      x: 100,
      y: 200,
      visible: true,
      occluded: false,
      distance: 300,
      scale: 1.0,
    };
    expect(pos.visible).toBe(true);
    expect(pos.scale).toBe(1.0);
  });

  it('OrbitalParameters satisfies structural contract', () => {
    const orbit: OrbitalParameters = {
      semiMajorAxis: 500,
      eccentricity: 0.3,
      inclination: 15,
      period: 100,
      phase: 45,
    };
    expect(orbit.eccentricity).toBe(0.3);
  });

  it('BoundaryData type field is always boundary', () => {
    const boundary: BoundaryData = {
      id: 'everdark',
      name: 'Everdark',
      subtitle: 'The Void',
      loreOrigin: 'Lore',
      type: 'boundary',
      contentPath: 'world/everdark',
      radius: 5000,
      renderConfig: { renderer: 'everdark' },
    };
    expect(boundary.type).toBe('boundary');
  });

  it('RenderConfig discriminated union covers all renderer types', () => {
    const configs: RenderConfig[] = [
      { renderer: 'star' },
      { renderer: 'planet' },
      { renderer: 'gasGiant' },
      { renderer: 'ringWorld' },
      { renderer: 'towerWorld' },
      { renderer: 'asteroidBelt' },
      { renderer: 'everdark' },
    ];
    expect(configs.length).toBe(7);
    expect(configs.map((c) => c.renderer)).toContain('star');
    expect(configs.map((c) => c.renderer)).toContain('everdark');
  });

  it('CelestialRendererType covers all 7 renderer types', () => {
    const types: CelestialRendererType[] = [
      'star',
      'planet',
      'gasGiant',
      'ringWorld',
      'towerWorld',
      'asteroidBelt',
      'everdark',
    ];
    expect(types.length).toBe(7);
  });

  it('CelestialBodyType covers all body types', () => {
    const types: CelestialBodyType[] = [
      'star',
      'planet',
      'gasGiant',
      'ringWorld',
      'towerWorld',
      'asteroidBelt',
      'boundary',
    ];
    expect(types.length).toBe(7);
  });
});
