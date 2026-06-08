/**
 * @fileoverview Adaptive Performance Controller
 * @description Tracks frame timing, computes smoothed FPS, and selects
 * runtime render-quality profiles with hysteresis. The controller is
 * renderer-agnostic and exposes profile data that renderers/mediators can
 * consume without coupling to implementation details.
 *
 * @module worldSim/optimization/AdaptivePerformanceController
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    DOWNSHIFT_CONFIRMATION_FRAMES,
    FRAME_TIME_ALPHA,
    QUALITY_THRESHOLDS,
    UPSHIFT_CONFIRMATION_FRAMES,
} from '@/modules/world-sim/infrastructure/config/performanceTuning';

/**
 * Runtime quality levels used by adaptive renderers.
 *
 * @typedef {'low' | 'medium' | 'high'} RenderQualityLevel
 */
export type RenderQualityLevel = 'low' | 'medium' | 'high';

/**
 * Runtime quality profile derived from current performance.
 *
 * @interface RenderQualityProfile
 * @property {RenderQualityLevel} level - Active quality level
 * @property {number} shaderDetailLevel - Shader detail level (0=low, 1=medium, 2=high)
 * @property {number} nearUpdateStride - Frame stride for near objects (1 = every frame)
 * @property {number} farUpdateStride - Frame stride for far objects (higher = fewer updates)
 * @property {number} farDistance - Distance threshold for far-update stride
 * @property {boolean} reduceSecondaryEffects - Whether optional visual effects should be reduced
 */
export interface RenderQualityProfile {
  /** @property {RenderQualityLevel} level - Active quality level */
  level: RenderQualityLevel;
  /** @property {number} shaderDetailLevel - Shader detail level used by adaptive shaders */
  shaderDetailLevel: number;
  /** @property {number} nearUpdateStride - Update stride for near bodies */
  nearUpdateStride: number;
  /** @property {number} farUpdateStride - Update stride for far bodies */
  farUpdateStride: number;
  /** @property {number} farDistance - Distance threshold for far update stride */
  farDistance: number;
  /** @property {boolean} reduceSecondaryEffects - Whether secondary FX should be reduced */
  reduceSecondaryEffects: boolean;
}

/**
 * Snapshot of controller timing metrics.
 *
 * @interface PerformanceMetrics
 * @property {number} averageFrameTimeMs - Smoothed frame time in milliseconds
 * @property {number} averageFps - Smoothed frames per second
 */
export interface PerformanceMetrics {
  /** @property {number} averageFrameTimeMs - Smoothed frame time in milliseconds */
  averageFrameTimeMs: number;
  /** @property {number} averageFps - Smoothed frames per second */
  averageFps: number;
}

/** @constant {number} DEFAULT_FRAME_TIME_MS - Default frame time estimate used before sampling */
const DEFAULT_FRAME_TIME_MS = 16.67;

/**
 * Quality profile lookup table.
 *
 * @constant {Record<RenderQualityLevel, RenderQualityProfile>}
 */
const QUALITY_PROFILES: Record<RenderQualityLevel, RenderQualityProfile> = {
  high: {
    level: 'high',
    shaderDetailLevel: 2,
    nearUpdateStride: 1,
    farUpdateStride: 1,
    farDistance: 6000,
    reduceSecondaryEffects: false,
  },
  medium: {
    level: 'medium',
    shaderDetailLevel: 1,
    nearUpdateStride: 1,
    farUpdateStride: 2,
    farDistance: 3200,
    reduceSecondaryEffects: false,
  },
  low: {
    level: 'low',
    shaderDetailLevel: 0,
    nearUpdateStride: 2,
    farUpdateStride: 4,
    farDistance: 1800,
    reduceSecondaryEffects: true,
  },
};

/**
 * Converts quality levels to ordered ranks.
 *
 * @param {RenderQualityLevel} level - Quality level
 * @returns {number} Numeric rank where low=0, medium=1, high=2
 */
function qualityRank(level: RenderQualityLevel): number {
  if (level === 'low') return 0;
  if (level === 'medium') return 1;
  return 2;
}

/**
 * Adaptive controller for quality scaling using smoothed frame timing.
 *
 * @class AdaptivePerformanceController
 */
export class AdaptivePerformanceController {
  /** @property {number} averageFrameTimeMs - Smoothed EWMA frame time */
  private averageFrameTimeMs: number = DEFAULT_FRAME_TIME_MS;

  /** @property {RenderQualityLevel} currentLevel - Current applied quality level */
  private currentLevel: RenderQualityLevel = 'high';

  /** @property {RenderQualityLevel} candidateLevel - Candidate quality level awaiting confirmation */
  private candidateLevel: RenderQualityLevel = 'high';

  /** @property {number} candidateFrames - Consecutive frames spent on candidate level */
  private candidateFrames: number = 0;

  /**
   * Sample one frame and update quality state.
   *
   * @param {number} deltaTimeSeconds - Frame delta in seconds
   * @returns {boolean} True when the active level changed this frame
   */
  sample(deltaTimeSeconds: number): boolean {
    const frameTimeMs = Math.max(deltaTimeSeconds * 1000, 0.001);
    this.averageFrameTimeMs =
      this.averageFrameTimeMs * (1 - FRAME_TIME_ALPHA) +
      frameTimeMs * FRAME_TIME_ALPHA;

    const targetLevel = this.computeTargetLevel();

    if (targetLevel !== this.candidateLevel) {
      this.candidateLevel = targetLevel;
      this.candidateFrames = 0;
      return false;
    }

    if (this.candidateLevel === this.currentLevel) {
      this.candidateFrames = 0;
      return false;
    }

    this.candidateFrames++;

    const isDownshift =
      qualityRank(this.candidateLevel) < qualityRank(this.currentLevel);
    const requiredFrames = isDownshift
      ? DOWNSHIFT_CONFIRMATION_FRAMES
      : UPSHIFT_CONFIRMATION_FRAMES;

    if (this.candidateFrames >= requiredFrames) {
      this.currentLevel = this.candidateLevel;
      this.candidateFrames = 0;
      return true;
    }

    return false;
  }

  /**
   * Get current quality level.
   *
   * @returns {RenderQualityLevel} Active quality level
   */
  getLevel(): RenderQualityLevel {
    return this.currentLevel;
  }

  /**
   * Get current quality profile.
   *
   * @returns {RenderQualityProfile} Active profile
   */
  getProfile(): RenderQualityProfile {
    return QUALITY_PROFILES[this.currentLevel];
  }

  /**
   * Get current timing metrics.
   *
   * @returns {PerformanceMetrics} Smoothed performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      averageFrameTimeMs: this.averageFrameTimeMs,
      averageFps: 1000 / this.averageFrameTimeMs,
    };
  }

  /**
   * Compute target quality level from smoothed FPS using hysteretic thresholds.
   * Different thresholds apply for upgrading vs downgrading to prevent oscillation.
   *
   * @private
   * @returns {RenderQualityLevel} Candidate target level
   */
  private computeTargetLevel(): RenderQualityLevel {
    const fps = 1000 / this.averageFrameTimeMs;

    if (this.currentLevel === 'high') {
      if (fps < QUALITY_THRESHOLDS.downgradeToMedium) {
        return 'medium';
      }
      return 'high';
    }

    if (this.currentLevel === 'medium') {
      if (fps > QUALITY_THRESHOLDS.upgradeToHigh) {
        return 'high';
      }
      if (fps < QUALITY_THRESHOLDS.downgradeToLow) {
        return 'low';
      }
      return 'medium';
    }

    if (this.currentLevel === 'low') {
      if (fps > QUALITY_THRESHOLDS.upgradeToMedium) {
        return 'medium';
      }
      return 'low';
    }

    return 'high';
  }
}
