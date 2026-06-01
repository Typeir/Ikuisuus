/**
 * @fileoverview Unit tests for Play Mode Utils barrel exports
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/utils/index.test
 * @description Validates all exports from the utils index module.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/playMode/utils
 */

import { describe, it, expect } from 'vitest';
import * as UtilsModule from '@/modules/encounter-planner/presentation/combatantRow/utils';

describe('playMode/utils index exports', () => {
  it('should export getPhaseMarker function', () => {
    expect(UtilsModule.getPhaseMarker).toBeDefined();
    expect(typeof UtilsModule.getPhaseMarker).toBe('function');
  });

  it('should export PHASE_THRESHOLDS constant', () => {
    expect(UtilsModule.PHASE_THRESHOLDS).toBeDefined();
    expect(typeof UtilsModule.PHASE_THRESHOLDS).toBe('object');
  });

  it('should export exactly expected members', () => {
    const exports = Object.keys(UtilsModule);
    expect(exports).toContain('getPhaseMarker');
    expect(exports).toContain('PHASE_THRESHOLDS');
  });
});
