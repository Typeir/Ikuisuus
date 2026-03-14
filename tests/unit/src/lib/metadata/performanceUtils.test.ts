/**
 * @fileoverview Performance Utilities Unit Tests
 * @description Tests for timer start/end lifecycle and elapsed measurement.
 *
 * @module tests/unit/lib/metadata/performanceUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { endTimer, startTimer } from '@/lib/metadata/performanceUtils';
import { describe, expect, it } from 'vitest';

describe('startTimer / endTimer', () => {
  it('should return elapsed time greater than 0', () => {
    startTimer('test-timer');
    const elapsed = endTimer('test-timer');
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 for unknown timer', () => {
    const elapsed = endTimer('nonexistent');
    expect(elapsed).toBe(0);
  });

  it('should clean up after endTimer', () => {
    startTimer('cleanup-test');
    endTimer('cleanup-test');
    const secondCall = endTimer('cleanup-test');
    expect(secondCall).toBe(0);
  });

  it('should track independent timers', () => {
    startTimer('timer-a');
    startTimer('timer-b');
    const elapsedA = endTimer('timer-a');
    const elapsedB = endTimer('timer-b');
    expect(elapsedA).toBeGreaterThanOrEqual(0);
    expect(elapsedB).toBeGreaterThanOrEqual(0);
  });
});
