/**
 * @fileoverview OrbitLineFactory Unit Tests
 * @description Tests createOrbitRing and createAllOrbitLines for correct geometry,
 * material, naming, and parent-relative parenting.
 *
 * @module tests/unit/worldSim/celestials/OrbitLineFactory
 */

import {
    createAllOrbitLines,
    createOrbitRing,
} from '@/modules/world-sim/infrastructure/geometry/factories/OrbitLineFactory';
import type { OrbitalParameters } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Mesh, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

/** Standard circular orbit for testing */
const CIRCULAR_ORBIT: OrbitalParameters = {
  semiMajorAxis: 200,
  eccentricity: 0,
  inclination: 0,
  period: 50,
  phase: 0,
};

/** Eccentric inclined orbit */
const ECCENTRIC_ORBIT: OrbitalParameters = {
  semiMajorAxis: 300,
  eccentricity: 0.3,
  inclination: 15,
  period: 80,
  phase: 45,
};

describe('createOrbitRing', () => {
  it('returns a Mesh object', () => {
    const ring = createOrbitRing(CIRCULAR_ORBIT, 'test-body');
    expect(ring).toBeInstanceOf(Mesh);
  });

  it('names the mesh with the body ID', () => {
    const ring = createOrbitRing(CIRCULAR_ORBIT, 'damocles');
    expect(ring.name).toBe('orbit-ring-damocles');
  });

  it('creates geometry and material', () => {
    const ring = createOrbitRing(CIRCULAR_ORBIT, 'test');
    expect(ring.geometry).toBeDefined();
    expect(ring.material).toBeDefined();
  });

  it('works with eccentric inclined orbit', () => {
    const ring = createOrbitRing(ECCENTRIC_ORBIT, 'eccentric');
    expect(ring).toBeInstanceOf(Mesh);
    expect(ring.geometry.attributes.position).toBeDefined();
  });

  it('sets renderOrder to -1', () => {
    const ring = createOrbitRing(CIRCULAR_ORBIT, 'test');
    expect(ring.renderOrder).toBe(-1);
  });
});

describe('createAllOrbitLines', () => {
  it('creates rings only for bodies with orbits', () => {
    const bodies = [
      { id: 'star', orbit: null },
      { id: 'planet-a', orbit: CIRCULAR_ORBIT },
      { id: 'planet-b', orbit: ECCENTRIC_ORBIT },
    ];
    const meshMap = new Map<string, Object3D>();

    const rings = createAllOrbitLines(bodies, meshMap);

    expect(rings.size).toBe(2);
    expect(rings.has('planet-a')).toBe(true);
    expect(rings.has('planet-b')).toBe(true);
    expect(rings.has('star')).toBe(false);
  });

  it('parents child orbit to parent mesh', () => {
    const parentMesh = new Object3D();
    parentMesh.name = 'parent';

    const bodies = [
      { id: 'parent', orbit: CIRCULAR_ORBIT },
      { id: 'child', orbit: ECCENTRIC_ORBIT, parentBodyId: 'parent' },
    ];
    const meshMap = new Map<string, Object3D>();
    meshMap.set('parent', parentMesh);

    const rings = createAllOrbitLines(bodies, meshMap);

    expect(rings.has('child')).toBe(true);
    /** Child ring should be a child of the parent mesh */
    expect(parentMesh.children.length).toBe(1);
  });

  it('returns empty map when no bodies have orbits', () => {
    const bodies = [{ id: 'star', orbit: null }];
    const rings = createAllOrbitLines(bodies, new Map());
    expect(rings.size).toBe(0);
  });
});
