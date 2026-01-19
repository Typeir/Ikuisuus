/**
 * Phase Marker Tests
 *
 * @fileoverview Unit tests for phaseMarker utility module.
 * Verifies phase marker styles and utilities.
 * @description This test suite ensures that the phase marker
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module phaseMarker.test
 * @requires vitest Test framework
 * @requires ../phaseMarker Phase marker utilities
 */

import { describe, it, expect } from 'vitest';
import { getPhaseMarker, PHASE_THRESHOLDS } from '@/lib/components/encounterPlanner/combatantRow/utils/phaseMarker';

describe('phaseMarker', () => {
  /**
   * Verifies PHASE_THRESHOLDS constant is properly exported
   */
  it('should export PHASE_THRESHOLDS constant', () => {
    expect(PHASE_THRESHOLDS).toBeDefined();
    expect(PHASE_THRESHOLDS.WOUNDED).toBe(75);
    expect(PHASE_THRESHOLDS.BLOODIED).toBe(50);
    expect(PHASE_THRESHOLDS.DOOMED).toBe(25);
    expect(PHASE_THRESHOLDS.SLAIN).toBe(0);
  });

  /**
   * Verifies getPhaseMarker function works correctly
   */
  it('should export getPhaseMarker function', () => {
    expect(getPhaseMarker).toBeDefined();
    expect(typeof getPhaseMarker).toBe('function');
  });
});
