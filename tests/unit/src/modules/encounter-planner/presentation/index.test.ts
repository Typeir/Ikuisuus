/**
 * @fileoverview Tests for encounter-planner module public barrel exports.
 * @module tests/unit/src/modules/encounter-planner/presentation/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/encounter-planner
 */

import * as EncounterPlannerExports from '@/modules/encounter-planner/index';
import { describe, expect, it } from 'vitest';

describe('encounter-planner module barrel exports', () => {
  describe('Module integrity', () => {
    it('should export expected number of runtime members', () => {
      const exports = Object.keys(EncounterPlannerExports);
      expect(exports.length).toBe(7);
    });

    it('should not export undefined values', () => {
      Object.values(EncounterPlannerExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export expected public runtime names', () => {
      const exports = Object.keys(EncounterPlannerExports);
      expect(exports).toEqual(
        expect.arrayContaining([
          'EncounterStorage',
          'HeroicAffix',
          'generateId',
          'fetchAffixIndex',
          'fetchMonsterIndex',
          'fetchSpellBySlug',
          'fetchSpellIndex',
        ]),
      );
    });
  });
});
