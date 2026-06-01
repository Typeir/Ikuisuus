/**
 * @fileoverview Tests for Play Mode Components Barrel Export
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/playMode
 */

import { describe, it, expect } from 'vitest';
import * as PlayModeExports from '@/modules/encounter-planner/playMode/index';

describe('encounterPlanner/playMode barrel exports', () => {
  describe('Component exports', () => {
    it('should export PlayMode', () => {
      expect(PlayModeExports.PlayMode).toBeDefined();
      expect(typeof PlayModeExports.PlayMode).toBe('function');
    });

    it('should export PlayModeCombatantRow', () => {
      expect(PlayModeExports.PlayModeCombatantRow).toBeDefined();
      expect(typeof PlayModeExports.PlayModeCombatantRow).toBe('function');
    });
  });

  describe('Module integrity', () => {
    it('should export expected number of components', () => {
      const exports = Object.keys(PlayModeExports);
      // Runtime exports (type-only exports are not included in Object.keys):
      // PlayMode, PlayModeCombatantRow, CombatantMainStats, CombatantNameSection,
      // CombatantMechanicsSection, CombatantHeroicSection, CombatantConditionsManager,
      // getPhaseMarker, PHASE_THRESHOLDS
      expect(exports.length).toBe(9);
    });

    it('should not export undefined values', () => {
      Object.values(PlayModeExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export only expected component names', () => {
      const exports = Object.keys(PlayModeExports);
      expect(exports).toEqual(expect.arrayContaining(['PlayMode', 'PlayModeCombatantRow']));
    });
  });
});
