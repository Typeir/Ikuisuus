/**
 * @fileoverview Tests for camera tuning constants
 */

import { describe, expect, it } from 'vitest';
import {
    BOUND_RADIUS,
    COMPLETION_THRESHOLD,
    DAMPING_FACTOR,
    EASE_FACTOR,
    MAX_DISTANCE,
    MAX_POLAR_ANGLE,
    MIN_DISTANCE,
    MIN_POLAR_ANGLE,
    ORBIT_SENSITIVITY,
    PAN_SCALE_FACTOR,
    REGION_TRANSITION_DURATION,
    SLERP_EPSILON,
    VELOCITY_THRESHOLD,
    ZOOM_SENSITIVITY,
} from '../../../../../../../src/lib/components/worldSim/config/cameraTuning';

describe('cameraTuning', () => {
  it('input sensitivities are positive', () => {
    expect(ORBIT_SENSITIVITY).toBeGreaterThan(0);
    expect(ZOOM_SENSITIVITY).toBeGreaterThan(0);
    expect(PAN_SCALE_FACTOR).toBeGreaterThan(0);
  });

  it('orbit distance bounds are ordered', () => {
    expect(MIN_DISTANCE).toBeLessThan(MAX_DISTANCE);
    expect(MIN_DISTANCE).toBeGreaterThan(0);
  });

  it('polar angle clamps avoid gimbal lock', () => {
    expect(MIN_POLAR_ANGLE).toBeGreaterThan(0);
    expect(MAX_POLAR_ANGLE).toBeLessThan(Math.PI);
    expect(MIN_POLAR_ANGLE).toBeLessThan(MAX_POLAR_ANGLE);
  });

  it('damping is in (0, 1)', () => {
    expect(DAMPING_FACTOR).toBeGreaterThan(0);
    expect(DAMPING_FACTOR).toBeLessThan(1);
    expect(VELOCITY_THRESHOLD).toBeGreaterThan(0);
  });

  it('transition tuning values are positive', () => {
    expect(EASE_FACTOR).toBeGreaterThan(0);
    expect(EASE_FACTOR).toBeLessThan(1);
    expect(COMPLETION_THRESHOLD).toBeGreaterThan(0);
    expect(REGION_TRANSITION_DURATION).toBeGreaterThan(0);
    expect(SLERP_EPSILON).toBeGreaterThan(0);
    expect(SLERP_EPSILON).toBeLessThan(0.01);
  });

  it('camera bound sits inside the Everdark radius (7000)', () => {
    expect(BOUND_RADIUS).toBeGreaterThan(0);
    expect(BOUND_RADIUS).toBeLessThan(7000);
  });
});
