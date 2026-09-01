/**
 * @fileoverview Orbital Mechanics Unit Tests
 * @description Tests Keplerian orbit computations, Kepler's equation solver,
 * and surface-position-to-world conversion with known analytical results.
 *
 * @module tests/unit/src/modules/world-sim/domain/celestials/OrbitalMechanics.test
 */

import {
    DEG_TO_RAD,
    computeOrbitalPosition,
    solveKeplerEquation,
    surfacePositionToWorld,
} from '@/modules/world-sim/domain/celestials/orbitalMechanics';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

describe('DEG_TO_RAD', () => {
  it('equals PI / 180', () => {
    expect(DEG_TO_RAD).toBeCloseTo(Math.PI / 180, 10);
  });
});

describe('solveKeplerEquation', () => {
  it('returns M for circular orbit (e=0)', () => {
    const M = 1.5;
    const E = solveKeplerEquation(M, 0);
    expect(E).toBeCloseTo(M, 6);
  });

  it('converges for moderate eccentricity', () => {
    const M = Math.PI / 4;
    const e = 0.5;
    const E = solveKeplerEquation(M, e);

    /** Verify M = E - e*sin(E) (Kepler's equation) */
    const reconstructedM = E - e * Math.sin(E);
    expect(reconstructedM).toBeCloseTo(M, 5);
  });

  it('converges for high eccentricity', () => {
    const M = 2.0;
    const e = 0.9;
    const E = solveKeplerEquation(M, e);

    const reconstructedM = E - e * Math.sin(E);
    expect(reconstructedM).toBeCloseTo(M, 5);
  });

  it('handles M = 0', () => {
    const E = solveKeplerEquation(0, 0.3);
    expect(E).toBeCloseTo(0, 6);
  });

  it('handles M = PI', () => {
    const E = solveKeplerEquation(Math.PI, 0.5);
    const reconstructedM = E - 0.5 * Math.sin(E);
    expect(reconstructedM).toBeCloseTo(Math.PI, 5);
  });
});

describe('computeOrbitalPosition', () => {
  it('places body at semiMajorAxis on x-axis at t=0 for circular uninclined orbit', () => {
    const orbit = {
      semiMajorAxis: 100,
      eccentricity: 0,
      inclination: 0,
      period: 100,
      phase: 0,
    };

    const pos = computeOrbitalPosition(orbit, 0);

    /** At t=0, M=0, E=0 → x = a(cos(0) - 0) = a, y/z = 0 */
    expect(pos.x).toBeCloseTo(100, 2);
    expect(pos.y).toBeCloseTo(0, 5);
    expect(pos.z).toBeCloseTo(0, 5);
  });

  it('places body at -semiMajorAxis at half period for circular orbit', () => {
    const orbit = {
      semiMajorAxis: 200,
      eccentricity: 0,
      inclination: 0,
      period: 10,
      phase: 0,
    };

    const pos = computeOrbitalPosition(orbit, 5);
    /** At M=π, E=π → x = a(cos(π) - 0) = -a, y = 0 */
    expect(pos.x).toBeCloseTo(-200, 2);
    expect(pos.y).toBeCloseTo(0, 3);
    expect(pos.z).toBeCloseTo(0, 3);
  });

  it('returns a Vector3', () => {
    const orbit = {
      semiMajorAxis: 50,
      eccentricity: 0.1,
      inclination: 10,
      period: 20,
      phase: 45,
    };

    const pos = computeOrbitalPosition(orbit, 3);
    expect(pos).toBeInstanceOf(Vector3);
  });

  it('produces non-zero y/z for inclined orbit', () => {
    const orbit = {
      semiMajorAxis: 100,
      eccentricity: 0,
      inclination: 45,
      period: 10,
      phase: 0,
    };

    /** At t = 2.5 (quarter period), M = π/2, should have non-zero y component */
    const pos = computeOrbitalPosition(orbit, 2.5);
    expect(pos.y).not.toBeCloseTo(0, 1);
  });

  it('maintains constant distance for circular orbit (e=0)', () => {
    const orbit = {
      semiMajorAxis: 100,
      eccentricity: 0,
      inclination: 0,
      period: 20,
      phase: 0,
    };

    const dist1 = computeOrbitalPosition(orbit, 0).length();
    const dist2 = computeOrbitalPosition(orbit, 5).length();
    const dist3 = computeOrbitalPosition(orbit, 10).length();

    expect(dist1).toBeCloseTo(100, 2);
    expect(dist2).toBeCloseTo(100, 2);
    expect(dist3).toBeCloseTo(100, 2);
  });
});

describe('surfacePositionToWorld', () => {
  it('places lat=0 lon=0 on positive x-axis', () => {
    const center = new Vector3(0, 0, 0);
    const pos = surfacePositionToWorld({ lat: 0, lon: 0 }, 10, center);

    expect(pos.x).toBeCloseTo(10, 5);
    expect(pos.y).toBeCloseTo(0, 5);
    expect(pos.z).toBeCloseTo(0, 5);
  });

  it('places north pole (lat=90) on positive y-axis', () => {
    const center = new Vector3(0, 0, 0);
    const pos = surfacePositionToWorld({ lat: 90, lon: 0 }, 10, center);

    expect(pos.x).toBeCloseTo(0, 3);
    expect(pos.y).toBeCloseTo(10, 3);
    expect(pos.z).toBeCloseTo(0, 3);
  });

  it('offsets by center position', () => {
    const center = new Vector3(100, 200, 300);
    const pos = surfacePositionToWorld({ lat: 0, lon: 0 }, 5, center);

    expect(pos.x).toBeCloseTo(105, 3);
    expect(pos.y).toBeCloseTo(200, 3);
    expect(pos.z).toBeCloseTo(300, 3);
  });

  it('places lon=90 on positive z-axis (from origin)', () => {
    const center = new Vector3(0, 0, 0);
    const pos = surfacePositionToWorld({ lat: 0, lon: 90 }, 10, center);

    expect(pos.x).toBeCloseTo(0, 3);
    expect(pos.y).toBeCloseTo(0, 3);
    expect(pos.z).toBeCloseTo(10, 3);
  });

  it('result distance from center equals radius', () => {
    const center = new Vector3(50, 50, 50);
    const pos = surfacePositionToWorld({ lat: 30, lon: 60 }, 20, center);

    const dist = pos.distanceTo(center);
    expect(dist).toBeCloseTo(20, 3);
  });
});
