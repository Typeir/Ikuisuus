/**
 * @fileoverview Tests for performance tuning constants
 */

import {
    DOWNSHIFT_CONFIRMATION_FRAMES,
    FRAME_TIME_ALPHA,
    QUALITY_THRESHOLDS,
    UPSHIFT_CONFIRMATION_FRAMES,
} from '@/modules/world-sim/infrastructure/config/performanceTuning';
import { describe, expect, it } from 'vitest';

describe('performanceTuning', () => {
  it('downgrade thresholds are lower than upgrade thresholds (hysteresis)', () => {
    expect(QUALITY_THRESHOLDS.downgradeToMedium).toBeLessThan(
      QUALITY_THRESHOLDS.upgradeToHigh,
    );
    expect(QUALITY_THRESHOLDS.downgradeToLow).toBeLessThan(
      QUALITY_THRESHOLDS.upgradeToMedium,
    );
  });

  it('low-tier thresholds are below medium-tier thresholds', () => {
    expect(QUALITY_THRESHOLDS.downgradeToLow).toBeLessThan(
      QUALITY_THRESHOLDS.downgradeToMedium,
    );
    expect(QUALITY_THRESHOLDS.upgradeToMedium).toBeLessThan(
      QUALITY_THRESHOLDS.upgradeToHigh,
    );
  });

  it('smoothing alpha is in (0, 1)', () => {
    expect(FRAME_TIME_ALPHA).toBeGreaterThan(0);
    expect(FRAME_TIME_ALPHA).toBeLessThan(1);
  });

  it('upshift is stickier than downshift', () => {
    expect(UPSHIFT_CONFIRMATION_FRAMES).toBeGreaterThan(
      DOWNSHIFT_CONFIRMATION_FRAMES,
    );
    expect(DOWNSHIFT_CONFIRMATION_FRAMES).toBeGreaterThan(0);
  });
});
