/**
 * @fileoverview Tests for Combobox Components Barrel Export
 * @description Validates all component exports from the comboboxes barrel.
 * @module tests/unit/src/modules/encounter-planner/presentation/comboboxes/index.test
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/presentation/comboboxes
 */

import { describe, it, expect } from 'vitest';
import * as ComboboxExports from '@/modules/encounter-planner/presentation/comboboxes/index';

describe('encounterPlanner/comboboxes barrel exports', () => {
  describe('Component exports', () => {
    it('should export AffixCombobox', () => {
      expect(ComboboxExports.AffixCombobox).toBeDefined();
      expect(typeof ComboboxExports.AffixCombobox).toBe('function');
    });

    it('should export CreatureCombobox', () => {
      expect(ComboboxExports.CreatureCombobox).toBeDefined();
      expect(typeof ComboboxExports.CreatureCombobox).toBe('function');
    });

    it('should export GenericCombobox', () => {
      expect(ComboboxExports.GenericCombobox).toBeDefined();
      expect(typeof ComboboxExports.GenericCombobox).toBe('function');
    });

    it('should export SpellCombobox', () => {
      expect(ComboboxExports.SpellCombobox).toBeDefined();
      expect(typeof ComboboxExports.SpellCombobox).toBe('function');
    });
  });

  describe('Module integrity', () => {
    it('should export expected minimum number of members', () => {
      const exports = Object.keys(ComboboxExports);
      expect(exports.length).toBeGreaterThanOrEqual(4);
    });

    it('should not export undefined values', () => {
      Object.values(ComboboxExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export only expected component names', () => {
      const exports = Object.keys(ComboboxExports);
      const expectedExports = ['AffixCombobox', 'CreatureCombobox', 'GenericCombobox', 'SpellCombobox'];
      expectedExports.forEach(name => {
        expect(exports).toContain(name);
      });
    });
  });
});
