/**
 * @fileoverview Geometry LOD Budget Definitions
 * @description Centralized segment-count budgets for every celestial body type at
 * three quality tiers. Renderers import these instead of hard-coding segment counts,
 * enabling scene-wide LOD control from a single file.
 *
 * Vertex budget summary (approximate):
 * | Tier   | Total scene vertices | Reduction vs original |
 * |--------|---------------------:|----------------------:|
 * | Legacy |            ~85 000   |                    —  |
 * | High   |            ~21 000   |                 75 %  |
 * | Medium |             ~5 000   |                 94 %  |
 * | Low    |             ~2 500   |                 97 %  |
 *
 * @module worldSim/optimization/GeometryBudgets
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { SphereGeometry } from 'three';
import type { RenderQualityLevel } from '@/modules/world-sim/application/services/AdaptivePerformanceController';

/**
 * Pre-built sphere geometries at three LOD tiers, keyed by quality level.
 *
 * @typedef {Record<RenderQualityLevel, SphereGeometry>} SphereLODSet
 */
export type SphereLODSet = Record<RenderQualityLevel, SphereGeometry>;

/**
 * Sphere segment counts per quality tier.
 * Used for stars, planets, gas giants, and icy cores.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const SPHERE_LOD: Record<RenderQualityLevel, number> = {
  high: 32,
  medium: 16,
  low: 8,
};

/**
 * Atmosphere shell segment counts per quality tier.
 * Simpler than surface spheres since the atmosphere is a smooth rim-lit shell.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const ATMOSPHERE_LOD: Record<RenderQualityLevel, number> = {
  high: 16,
  medium: 12,
  low: 8,
};

/**
 * Gas giant cloud layer segments per quality tier.
 * Base layer (opaque) is denser; overlay (transparent parallax) is lighter.
 *
 * @constant {Record<RenderQualityLevel, { base: number; overlay: number }>}
 */
export const GAS_GIANT_LOD: Record<
  RenderQualityLevel,
  { base: number; overlay: number }
> = {
  high: { base: 24, overlay: 16 },
  medium: { base: 16, overlay: 12 },
  low: { base: 12, overlay: 8 },
};

/**
 * Icy core (ring world) segment counts per quality tier.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const ICY_CORE_LOD: Record<RenderQualityLevel, number> = {
  high: 24,
  medium: 16,
  low: 8,
};

/**
 * Everdark boundary shell segments per quality tier.
 * Array entries are outer → inner layer.
 *
 * @constant {Record<RenderQualityLevel, number[]>}
 */
export const EVERDARK_LOD: Record<RenderQualityLevel, number[]> = {
  high: [32, 24, 16],
  medium: [16, 12, 8],
  low: [12, 8, 8],
};

/**
 * Torus ring segments (applied once at creation, not LOD-swapped).
 * Reduced from legacy 24 radial / 120 tubular.
 *
 * @constant {number}
 */
export const TORUS_RADIAL_SEGMENTS = 12;

/**
 * Torus tubular segments (legacy: 120 → 48).
 *
 * @constant {number}
 */
export const TORUS_TUBULAR_SEGMENTS = 48;

/**
 * Main tower cylinder radial segments (legacy: 32 → 12).
 *
 * @constant {number}
 */
export const TOWER_CYLINDER_RADIAL = 12;

/**
 * Main tower cylinder height segments (legacy: 24 → 8).
 *
 * @constant {number}
 */
export const TOWER_CYLINDER_HEIGHT = 8;

/**
 * Orbiter pillar radial segments (legacy: 16 → 8).
 *
 * @constant {number}
 */
export const ORBITER_CYLINDER_RADIAL = 8;

/**
 * Orbiter pillar height segments (legacy: 12 → 6).
 *
 * @constant {number}
 */
export const ORBITER_CYLINDER_HEIGHT = 6;

/**
 * Star corona ring geometry segments (legacy: 64 → 32).
 *
 * @constant {number}
 */
export const STAR_RING_SEGMENTS = 32;

/**
 * Maximum visible torus rings on ring-world per quality tier.
 * Hiding distant rings saves entire shader draw calls.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const MAX_VISIBLE_RINGS: Record<RenderQualityLevel, number> = {
  high: 7,
  medium: 5,
  low: 3,
};

/**
 * Maximum visible orbiter pillars on tower-world per quality tier.
 * Each hidden orbiter saves a ShaderMaterial draw call plus its glow sprite.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const MAX_VISIBLE_ORBITERS: Record<RenderQualityLevel, number> = {
  high: 10,
  medium: 6,
  low: 3,
};

/**
 * Device pixel ratio cap per quality tier.
 * Reducing DPR from 2→1 on a 1080p phone cuts fragment count by 4×.
 *
 * @constant {Record<RenderQualityLevel, number>}
 */
export const DPR_CAP: Record<RenderQualityLevel, number> = {
  high: 2,
  medium: 1.5,
  low: 1,
};

/**
 * Background starfield particle count (legacy: 2000 → 1200).
 *
 * @constant {number}
 */
export const STARFIELD_BUDGET = 1200;

/**
 * Create a set of three SphereGeometry instances at LOD tiers for a given radius.
 * Renderers call this once during mesh construction and store the result for
 * swap-on-quality-change. The caller owns disposal of all three geometries.
 *
 * @function createSphereLODSet
 * @param {number} radius - Sphere radius in scene units
 * @param {Record<RenderQualityLevel, number>} [segments] - Override segment table
 * @returns {SphereLODSet} Three geometries keyed by quality level
 */
export function createSphereLODSet(
  radius: number,
  segments: Record<RenderQualityLevel, number> = SPHERE_LOD,
): SphereLODSet {
  return {
    high: new SphereGeometry(radius, segments.high, segments.high),
    medium: new SphereGeometry(radius, segments.medium, segments.medium),
    low: new SphereGeometry(radius, segments.low, segments.low),
  };
}

/**
 * Dispose all geometries in a SphereLODSet.
 *
 * @function disposeSphereLODSet
 * @param {SphereLODSet | null} lodSet - Set to dispose
 */
export function disposeSphereLODSet(lodSet: SphereLODSet | null): void {
  if (!lodSet) return;
  lodSet.high.dispose();
  lodSet.medium.dispose();
  lodSet.low.dispose();
}
