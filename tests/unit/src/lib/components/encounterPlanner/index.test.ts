/**
 * @fileoverview Tests for Encounter Planner Component Barrel Export
 * @module tests/unit/src/lib/components/encounterPlanner/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/encounterPlanner
 */

import { describe, it, expect } from 'vitest';
import * as EncounterPlannerExports from '@/lib/components/encounterPlanner/index';

describe('encounterPlanner barrel exports', () => {
  describe('Component exports', () => {
    it('should export SpellCombobox', () => {
      expect(EncounterPlannerExports.SpellCombobox).toBeDefined();
      expect(typeof EncounterPlannerExports.SpellCombobox).toBe('function');
    });

    it('should export EncounterPlanner', () => {
      expect(EncounterPlannerExports.EncounterPlanner).toBeDefined();
      expect(typeof EncounterPlannerExports.EncounterPlanner).toBe('function');
    });

    it('should export PlayMode', () => {
      expect(EncounterPlannerExports.PlayMode).toBeDefined();
      expect(typeof EncounterPlannerExports.PlayMode).toBe('function');
    });
  });

  describe('Module integrity', () => {
    it('should export expected number of components', () => {
      const exports = Object.keys(EncounterPlannerExports);
      expect(exports.length).toBe(4);
    });

    it('should not export undefined values', () => {
      Object.values(EncounterPlannerExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export only expected component names', () => {
      const exports = Object.keys(EncounterPlannerExports);
      expect(exports).toEqual(expect.arrayContaining(['SpellCombobox', 'CombatantRow', 'EncounterPlanner', 'PlayMode']));
    });
  });
});
