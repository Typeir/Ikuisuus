/**
 * CombatantRow Utils Index Tests
 *
 * @fileoverview Unit tests for combatantRow utils barrel export.
 * Verifies all utilities are properly exported.
 * @description This test suite ensures that all utility functions and constants
 * from the combatantRow utils module are correctly exported through the index file.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module utils/index.test
 * @requires vitest Test framework
 * @requires ../index Utilities barrel export
 */

import { describe, it, expect } from 'vitest';
import * as UtilsModule from '@/modules/encounter-planner/presentation/combatantRow/utils';

describe('CombatantRow Utils Index', () => {
  /**
   * Verifies getPhaseMarker function is exported
   */
  it('should export getPhaseMarker function', () => {
    expect(UtilsModule.getPhaseMarker).toBeDefined();
    expect(typeof UtilsModule.getPhaseMarker).toBe('function');
  });

  /**
   * Verifies PHASE_THRESHOLDS constant is exported
   */
  it('should export PHASE_THRESHOLDS constant', () => {
    expect(UtilsModule.PHASE_THRESHOLDS).toBeDefined();
    expect(UtilsModule.PHASE_THRESHOLDS.WOUNDED).toBe(75);
    expect(UtilsModule.PHASE_THRESHOLDS.BLOODIED).toBe(50);
    expect(UtilsModule.PHASE_THRESHOLDS.DOOMED).toBe(25);
    expect(UtilsModule.PHASE_THRESHOLDS.SLAIN).toBe(0);
  });
});
