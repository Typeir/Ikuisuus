/**
 * @fileoverview Smoke tests for CollisionCloudLayers constant exports.
 * @description Validates that the scale constants and timing values exported by
 * collisionCloudLayers.core have the expected numeric types and ranges.
 * Factory functions are untested.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/effects/collisionCloudLayers.core.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    APEX_TIME,
    CORE_RADIUS_SCALE,
    CORONA_RADIUS_SCALE,
    DEBRIS_RADIUS_SCALE,
    FADE_DURATION,
    TRIGGER_GAP_SCALE,
} from '@/modules/world-sim/infrastructure/effects/collisionCloudLayers.core';
import { describe, expect, it } from 'vitest';

describe('collisionCloudLayers.core constants', () => {
  it('TRIGGER_GAP_SCALE is a positive number', () => {
    expect(typeof TRIGGER_GAP_SCALE).toBe('number');
    expect(TRIGGER_GAP_SCALE).toBeGreaterThan(0);
  });

  it('scale constants are ordered by increasing size', () => {
    expect(CORE_RADIUS_SCALE).toBeLessThan(DEBRIS_RADIUS_SCALE);
    expect(DEBRIS_RADIUS_SCALE).toBeLessThan(CORONA_RADIUS_SCALE);
  });

  it('APEX_TIME is a positive finite number', () => {
    expect(Number.isFinite(APEX_TIME)).toBe(true);
    expect(APEX_TIME).toBeGreaterThan(0);
  });

  it('FADE_DURATION is greater than APEX_TIME', () => {
    expect(FADE_DURATION).toBeGreaterThan(APEX_TIME);
  });
});
