/**
 * @fileoverview Tests for scene tuning constants
 */

import { describe, expect, it } from 'vitest';
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    DEFAULT_GLOW_OPACITY,
    DEFAULT_GLOW_SCALE,
    LOCAL_COORD_VIEW_DISTANCE,
    MAX_LABEL_DISTANCE,
    MAX_LABEL_SCALE,
    MIN_LABEL_DISTANCE,
    MIN_LABEL_SCALE,
    OCCLUSION_FRAME_STRIDE,
    OCCLUSION_OPACITY_THRESHOLD,
    REGION_VIEW_DISTANCE,
    SCENE_BACKGROUND_COLOR,
    STARFIELD_COUNT,
    STARFIELD_SPREAD,
    VIEW_DISTANCE_MULTIPLIER,
} from '../../../../../../../src/lib/components/worldSim/config/sceneTuning';

describe('sceneTuning', () => {
  it('starfield counts/spread are positive', () => {
    expect(STARFIELD_COUNT).toBeGreaterThan(0);
    expect(STARFIELD_SPREAD).toBeGreaterThan(0);
  });

  it('camera clip planes are ordered', () => {
    expect(CAMERA_NEAR).toBeGreaterThan(0);
    expect(CAMERA_NEAR).toBeLessThan(CAMERA_FAR);
    expect(CAMERA_FOV).toBeGreaterThan(0);
    expect(CAMERA_FOV).toBeLessThan(180);
  });

  it('background color is a hex string', () => {
    expect(SCENE_BACKGROUND_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('label distance + scale bounds are ordered', () => {
    expect(MIN_LABEL_DISTANCE).toBeLessThan(MAX_LABEL_DISTANCE);
    expect(MIN_LABEL_SCALE).toBeLessThan(MAX_LABEL_SCALE);
    expect(MIN_LABEL_SCALE).toBeGreaterThan(0);
  });

  it('view-distance multipliers are positive', () => {
    expect(VIEW_DISTANCE_MULTIPLIER).toBeGreaterThan(0);
    expect(REGION_VIEW_DISTANCE).toBeGreaterThan(0);
    expect(LOCAL_COORD_VIEW_DISTANCE).toBeGreaterThan(0);
  });

  it('occlusion tuning is sane', () => {
    expect(OCCLUSION_FRAME_STRIDE).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(OCCLUSION_FRAME_STRIDE)).toBe(true);
    expect(OCCLUSION_OPACITY_THRESHOLD).toBeGreaterThan(0);
    expect(OCCLUSION_OPACITY_THRESHOLD).toBeLessThanOrEqual(1);
  });

  it('glow defaults are positive', () => {
    expect(DEFAULT_GLOW_SCALE).toBeGreaterThan(0);
    expect(DEFAULT_GLOW_OPACITY).toBeGreaterThan(0);
    expect(DEFAULT_GLOW_OPACITY).toBeLessThanOrEqual(1);
  });
});
