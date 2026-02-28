/**
 * @fileoverview Celestial Registry Unit Tests
 * @description Tests query methods using injected fixture data.
 * Uses the customData constructor parameter to avoid coupling to
 * the real blackCradleRegistry.json and singleton state.
 *
 * @module tests/unit/worldSim/celestials/CelestialRegistry
 */

import { CelestialRegistry } from '@/lib/components/worldSim/celestials/CelestialRegistry';
import type {
    CelestialBodyData,
    CelestialRegistryData,
} from '@/lib/components/worldSim/celestials/interfaces';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Minimal fixture data for testing registry queries.
 */
const FIXTURE_DATA: CelestialRegistryData = {
  bodies: [
    {
      id: 'star-1',
      name: 'Test Star',
      type: 'star',
      radius: 80,
      renderConfig: { type: 'star', emissiveColor: '#ffcc44' },
      orbit: {
        semiMajorAxis: 0,
        eccentricity: 0,
        inclination: 0,
        period: 1,
        phase: 0,
      },
    },
    {
      id: 'planet-1',
      name: 'Test Planet',
      type: 'planet',
      radius: 30,
      parentBodyId: 'star-1',
      contentPath: 'world/test-planet',
      renderConfig: { type: 'planet', baseColor: '#4488cc' },
      orbit: {
        semiMajorAxis: 500,
        eccentricity: 0.1,
        inclination: 5,
        period: 100,
        phase: 0,
      },
      regions: [
        {
          id: 'region-a',
          name: 'Region A',
          contentPath: 'world/test-planet/region-a',
          surfacePosition: { lat: 30, lon: 60 },
          areaScale: 0.8,
        },
        {
          id: 'region-b',
          name: 'Region B',
          surfacePosition: { lat: -20, lon: 120 },
          areaScale: 0.5,
        },
      ],
    },
    {
      id: 'planet-2',
      name: 'Barren Planet',
      type: 'planet',
      radius: 20,
      parentBodyId: 'star-1',
      renderConfig: { type: 'planet', baseColor: '#888888' },
      orbit: {
        semiMajorAxis: 800,
        eccentricity: 0,
        inclination: 0,
        period: 200,
        phase: 0,
      },
    },
  ] as CelestialBodyData[],
  boundary: {
    id: 'everdark',
    name: 'The Everdark',
    radius: 5000,
    renderConfig: { type: 'everdark' },
  },
} as CelestialRegistryData;

describe('CelestialRegistry', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function createRegistry(): CelestialRegistry {
    return new CelestialRegistry(FIXTURE_DATA);
  }

  it('returns all bodies', () => {
    const registry = createRegistry();
    const bodies = registry.getAllBodies();

    expect(bodies).toHaveLength(3);
    expect(bodies.map((b) => b.id)).toEqual(['star-1', 'planet-1', 'planet-2']);
  });

  it('returns boundary data', () => {
    const registry = createRegistry();
    const boundary = registry.getBoundary();

    expect(boundary.id).toBe('everdark');
    expect(boundary.radius).toBe(5000);
  });

  it('finds a body by ID', () => {
    const registry = createRegistry();
    const body = registry.getBodyById('planet-1');

    expect(body).toBeDefined();
    expect(body!.name).toBe('Test Planet');
    expect(body!.radius).toBe(30);
  });

  it('returns undefined for unknown body ID', () => {
    const registry = createRegistry();
    const body = registry.getBodyById('nonexistent');

    expect(body).toBeUndefined();
  });

  it('filters bodies by type', () => {
    const registry = createRegistry();
    const planets = registry.getBodiesByType('planet');

    expect(planets).toHaveLength(2);
    expect(planets.every((b) => b.type === 'planet')).toBe(true);
  });

  it('returns empty array for unmatched type', () => {
    const registry = createRegistry();
    const gasGiants = registry.getBodiesByType('gasGiant');

    expect(gasGiants).toEqual([]);
  });

  it('returns regions for a body with regions', () => {
    const registry = createRegistry();
    const regions = registry.getRegions('planet-1');

    expect(regions).toHaveLength(2);
    expect(regions[0].id).toBe('region-a');
    expect(regions[1].id).toBe('region-b');
  });

  it('returns empty array for body without regions', () => {
    const registry = createRegistry();
    const regions = registry.getRegions('planet-2');

    expect(regions).toEqual([]);
  });

  it('returns empty array for unknown body in getRegions', () => {
    const registry = createRegistry();
    const regions = registry.getRegions('nonexistent');

    expect(regions).toEqual([]);
  });

  it('finds a specific region by body and region ID', () => {
    const registry = createRegistry();
    const region = registry.getRegion('planet-1', 'region-a');

    expect(region).toBeDefined();
    expect(region!.name).toBe('Region A');
    expect(region!.contentPath).toBe('world/test-planet/region-a');
  });

  it('returns undefined for unknown region ID', () => {
    const registry = createRegistry();
    const region = registry.getRegion('planet-1', 'nonexistent');

    expect(region).toBeUndefined();
  });

  it('returns undefined for region on unknown body', () => {
    const registry = createRegistry();
    const region = registry.getRegion('nonexistent', 'region-a');

    expect(region).toBeUndefined();
  });

  it('shared() returns a singleton instance', () => {
    const a = CelestialRegistry.shared();
    const b = CelestialRegistry.shared();

    expect(a).toBe(b);
  });
});
