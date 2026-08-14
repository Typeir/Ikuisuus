/**
 * @fileoverview AdaptivePerformanceController Unit Tests
 * @description Tests frame-timing smoothing, quality-level transitions, and quality profile values.
 *
 * @module tests/unit/worldSim/optimization/AdaptivePerformanceController
 */

import { AdaptivePerformanceController } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import { describe, expect, it } from 'vitest';

/**
 * Samples the controller with a fixed delta time for N frames.
 *
 * @param {AdaptivePerformanceController} controller - Controller under test
 * @param {number} deltaTime - Frame delta in seconds
 * @param {number} frameCount - Number of frames to sample
 */
function sampleFrames(
  controller: AdaptivePerformanceController,
  deltaTime: number,
  frameCount: number,
): void {
  for (let i = 0; i < frameCount; i++) {
    controller.sample(deltaTime);
  }
}

describe('AdaptivePerformanceController', () => {
  it('defaults to high quality profile', () => {
    const controller = new AdaptivePerformanceController();

    expect(controller.getLevel()).toBe('high');
    expect(controller.getProfile().shaderDetailLevel).toBe(2);
  });

  it('downshifts quality under sustained low FPS', () => {
    const controller = new AdaptivePerformanceController();

    sampleFrames(controller, 1 / 20, 140);

    expect(controller.getLevel()).toBe('low');
    expect(controller.getProfile().nearUpdateStride).toBe(2);
    expect(controller.getProfile().farUpdateStride).toBe(4);
  });

  it('upshifts quality after sustained recovery', () => {
    const controller = new AdaptivePerformanceController();

    sampleFrames(controller, 1 / 20, 140);
    expect(controller.getLevel()).toBe('low');

    sampleFrames(controller, 1 / 120, 260);

    expect(controller.getLevel()).toBe('high');
    expect(controller.getProfile().shaderDetailLevel).toBe(2);
  });

  it('reports positive smoothed performance metrics', () => {
    const controller = new AdaptivePerformanceController();

    sampleFrames(controller, 1 / 60, 30);
    const metrics = controller.getMetrics();

    expect(metrics.averageFrameTimeMs).toBeGreaterThan(0);
    expect(metrics.averageFps).toBeGreaterThan(0);
  });
});
