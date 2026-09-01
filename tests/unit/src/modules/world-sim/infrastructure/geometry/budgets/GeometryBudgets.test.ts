/**
 * GeometryBudgets Unit Tests
 *
 * @fileoverview Tests for LOD budget constants and sphere LOD factory functions.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets.test
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('three', () => ({
  SphereGeometry: vi.fn().mockImplementation(function MockSphereGeometry(
    radius: number,
    w: number,
    h: number,
  ) {
    return {
      radius,
      widthSegments: w,
      heightSegments: h,
      dispose: vi.fn(),
    };
  }),
}));

vi.mock('./AdaptivePerformanceController', () => ({}));

import {
  ATMOSPHERE_LOD,
  createSphereLODSet,
  disposeSphereLODSet,
  DPR_CAP,
  EVERDARK_LOD,
  GAS_GIANT_LOD,
  ICY_CORE_LOD,
  MAX_VISIBLE_ORBITERS,
  MAX_VISIBLE_RINGS,
  ORBITER_CYLINDER_HEIGHT,
  ORBITER_CYLINDER_RADIAL,
  SPHERE_LOD,
  STAR_RING_SEGMENTS,
  STARFIELD_BUDGET,
  TORUS_RADIAL_SEGMENTS,
  TORUS_TUBULAR_SEGMENTS,
  TOWER_CYLINDER_HEIGHT,
  TOWER_CYLINDER_RADIAL,
} from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';

describe('GeometryBudgets constants', () => {
  it('should define SPHERE_LOD with three tiers', () => {
    expect(SPHERE_LOD.high).toBeGreaterThan(SPHERE_LOD.medium);
    expect(SPHERE_LOD.medium).toBeGreaterThan(SPHERE_LOD.low);
  });

  it('should define ATMOSPHERE_LOD with three tiers', () => {
    expect(ATMOSPHERE_LOD.high).toBeGreaterThanOrEqual(ATMOSPHERE_LOD.medium);
    expect(ATMOSPHERE_LOD.medium).toBeGreaterThanOrEqual(ATMOSPHERE_LOD.low);
  });

  it('should define GAS_GIANT_LOD with base and overlay', () => {
    expect(GAS_GIANT_LOD.high.base).toBeGreaterThan(GAS_GIANT_LOD.high.overlay);
    expect(GAS_GIANT_LOD.low.base).toBeLessThanOrEqual(
      GAS_GIANT_LOD.medium.base,
    );
  });

  it('should define ICY_CORE_LOD with three tiers', () => {
    expect(ICY_CORE_LOD).toHaveProperty('high');
    expect(ICY_CORE_LOD).toHaveProperty('medium');
    expect(ICY_CORE_LOD).toHaveProperty('low');
  });

  it('should define EVERDARK_LOD as arrays', () => {
    expect(Array.isArray(EVERDARK_LOD.high)).toBe(true);
    expect(EVERDARK_LOD.high.length).toBe(3);
  });

  it('should export scalar constants', () => {
    expect(TORUS_RADIAL_SEGMENTS).toBe(12);
    expect(TORUS_TUBULAR_SEGMENTS).toBe(48);
    expect(TOWER_CYLINDER_RADIAL).toBe(12);
    expect(TOWER_CYLINDER_HEIGHT).toBe(8);
    expect(ORBITER_CYLINDER_RADIAL).toBe(8);
    expect(ORBITER_CYLINDER_HEIGHT).toBe(6);
    expect(STAR_RING_SEGMENTS).toBe(32);
    expect(STARFIELD_BUDGET).toBe(1200);
  });

  it('should define MAX_VISIBLE tiers in descending order', () => {
    expect(MAX_VISIBLE_RINGS.high).toBeGreaterThan(MAX_VISIBLE_RINGS.low);
    expect(MAX_VISIBLE_ORBITERS.high).toBeGreaterThan(MAX_VISIBLE_ORBITERS.low);
  });

  it('should define DPR_CAP in descending order', () => {
    expect(DPR_CAP.high).toBeGreaterThan(DPR_CAP.low);
  });
});

describe('createSphereLODSet', () => {
  it('should create three geometries', () => {
    const set = createSphereLODSet(5);
    expect(set.high).toBeDefined();
    expect(set.medium).toBeDefined();
    expect(set.low).toBeDefined();
  });

  it('should use provided segment overrides', () => {
    const segs = { high: 64, medium: 32, low: 16 };
    const set = createSphereLODSet(10, segs);
    expect((set.high as any).widthSegments).toBe(64);
    expect((set.low as any).widthSegments).toBe(16);
  });
});

describe('disposeSphereLODSet', () => {
  it('should call dispose on all three geometries', () => {
    const set = createSphereLODSet(5);
    disposeSphereLODSet(set);
    expect((set.high as any).dispose).toHaveBeenCalled();
    expect((set.medium as any).dispose).toHaveBeenCalled();
    expect((set.low as any).dispose).toHaveBeenCalled();
  });

  it('should handle null safely', () => {
    expect(() => disposeSphereLODSet(null)).not.toThrow();
  });
});
