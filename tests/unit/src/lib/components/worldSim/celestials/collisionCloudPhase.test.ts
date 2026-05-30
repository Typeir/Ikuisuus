/**
 * @fileoverview Tests for collision cloud phase envelope math.
 */

import {
    computeJitter,
    computeLinearTaper,
    computePhaseEnvelope,
} from '@/lib/components/worldSim/celestials/collisionCloudPhase';
import { describe, expect, it } from 'vitest';

const APEX = 3;
const FADE = 5;
const GROWTH = 0.55;

describe('computePhaseEnvelope', () => {
  it('returns zero opacity and zero size at t=0', () => {
    const env = computePhaseEnvelope(0, APEX, FADE, GROWTH);
    expect(env.opacity).toBe(0);
    expect(env.sizeNorm).toBe(0);
  });

  it('reaches opacity=1 and sizeNorm=1 exactly at apex', () => {
    const env = computePhaseEnvelope(APEX, APEX, FADE, GROWTH);
    expect(env.opacity).toBeCloseTo(1, 5);
    expect(env.sizeNorm).toBeCloseTo(1, 5);
  });

  it('continues to grow past apex (size monotonic)', () => {
    const a = computePhaseEnvelope(APEX, APEX, FADE, GROWTH);
    const b = computePhaseEnvelope(APEX + 2, APEX, FADE, GROWTH);
    const c = computePhaseEnvelope(APEX + FADE, APEX, FADE, GROWTH);
    expect(b.sizeNorm).toBeGreaterThan(a.sizeNorm);
    expect(c.sizeNorm).toBeGreaterThan(b.sizeNorm);
  });

  it('fades opacity to zero at apex+fadeDuration', () => {
    const env = computePhaseEnvelope(APEX + FADE, APEX, FADE, GROWTH);
    expect(env.opacity).toBe(0);
  });

  it('opacity is fully opaque (1) throughout the pre-apex grow phase', () => {
    const a = computePhaseEnvelope(0.5, APEX, FADE, GROWTH);
    const b = computePhaseEnvelope(1.5, APEX, FADE, GROWTH);
    const c = computePhaseEnvelope(2.5, APEX, FADE, GROWTH);
    expect(a.opacity).toBe(1);
    expect(b.opacity).toBe(1);
    expect(c.opacity).toBe(1);
  });

  it('opacity is monotonically decreasing post-apex', () => {
    const a = computePhaseEnvelope(APEX + 0.5, APEX, FADE, GROWTH);
    const b = computePhaseEnvelope(APEX + 2.0, APEX, FADE, GROWTH);
    const c = computePhaseEnvelope(APEX + 4.0, APEX, FADE, GROWTH);
    expect(b.opacity).toBeLessThan(a.opacity);
    expect(c.opacity).toBeLessThan(b.opacity);
  });
});

describe('computeLinearTaper', () => {
  it('returns 1 at t=0 and 0 at totalDuration', () => {
    expect(computeLinearTaper(0, 8)).toBe(1);
    expect(computeLinearTaper(8, 8)).toBe(0);
  });

  it('decreases at a constant rate (linear)', () => {
    const a = computeLinearTaper(2, 8);
    const b = computeLinearTaper(4, 8);
    const c = computeLinearTaper(6, 8);
    expect(b - a).toBeCloseTo(a - 1, 5);
    expect(c - b).toBeCloseTo(b - a, 5);
  });

  it('clamps outside [0, totalDuration]', () => {
    expect(computeLinearTaper(-1, 8)).toBe(1);
    expect(computeLinearTaper(20, 8)).toBe(0);
  });
});

describe('computeJitter', () => {
  it('returns 0 when envelope is 0', () => {
    expect(computeJitter(1.234, 0, 7, 0.22, 0.11)).toBe(0);
  });

  it('respects the cap', () => {
    let max = 0;
    for (let t = 0; t < 2; t += 0.01) {
      const j = computeJitter(t, 1, 7, 1.0, 0.11);
      max = Math.max(max, Math.abs(j));
    }
    expect(max).toBeLessThanOrEqual(0.11 + 1e-9);
  });

  it('produces many zero crossings per second at high frequency', () => {
    let crossings = 0;
    let prev = computeJitter(0, 1, 7, 0.22, 0.11);
    for (let t = 0.001; t < 1; t += 0.001) {
      const j = computeJitter(t, 1, 7, 0.22, 0.11);
      if ((prev > 0 && j < 0) || (prev < 0 && j > 0)) crossings++;
      prev = j;
    }
    expect(crossings).toBeGreaterThanOrEqual(12);
  });
});
