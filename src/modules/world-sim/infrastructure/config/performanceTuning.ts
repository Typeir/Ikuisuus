/**
 * @fileoverview Performance Tuning Constants — Adaptive Quality Thresholds
 * @description FPS thresholds, frame-time smoothing, and hysteresis windows
 * consumed by `AdaptivePerformanceController`.
 *
 * @module modules/world-sim/infrastructure/config/performanceTuning
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/**
 * @interface QualityThresholds
 * @property {number} downgradeToMedium - FPS below which High quality drops to Medium.
 * @property {number} upgradeToHigh - FPS above which Medium quality rises to High.
 * @property {number} downgradeToLow - FPS below which Medium quality drops to Low.
 * @property {number} upgradeToMedium - FPS above which Low quality rises to Medium.
 */
export interface QualityThresholds {
  /** @property {number} downgradeToMedium - FPS below which High quality drops to Medium. */
  downgradeToMedium: number;
  /** @property {number} upgradeToHigh - FPS above which Medium quality rises to High. */
  upgradeToHigh: number;
  /** @property {number} downgradeToLow - FPS below which Medium quality drops to Low. */
  downgradeToLow: number;
  /** @property {number} upgradeToMedium - FPS above which Low quality rises to Medium. */
  upgradeToMedium: number;
}

/** @constant {QualityThresholds} QUALITY_THRESHOLDS - FPS bands governing quality-tier transitions. */
export const QUALITY_THRESHOLDS: QualityThresholds = {
  downgradeToMedium: 48,
  upgradeToHigh: 58,
  downgradeToLow: 36,
  upgradeToMedium: 56,
};

/** @constant {number} FRAME_TIME_ALPHA - EWMA smoothing factor (0-1) for averaged frame time; lower values are stickier. */
export const FRAME_TIME_ALPHA = 0.08;

/** @constant {number} DOWNSHIFT_CONFIRMATION_FRAMES - Consecutive low-FPS frames required before dropping a quality tier. */
export const DOWNSHIFT_CONFIRMATION_FRAMES = 20;

/** @constant {number} UPSHIFT_CONFIRMATION_FRAMES - Consecutive high-FPS frames required before raising a quality tier. */
export const UPSHIFT_CONFIRMATION_FRAMES = 90;
