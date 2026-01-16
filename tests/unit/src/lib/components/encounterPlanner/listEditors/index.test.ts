/**
 * @fileoverview Tests for List Editors Barrel Export
 * @module tests/unit/src/lib/components/encounterPlanner/listEditors/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/listEditors
 */

import { describe, it, expect } from 'vitest';
import * as ListEditorExports from '@/lib/components/encounterPlanner/listEditors/index';

describe('encounterPlanner/listEditors barrel exports', () => {
  describe('Component exports', () => {
    it('should export AffixListEditor', () => {
      expect(ListEditorExports.AffixListEditor).toBeDefined();
      expect(typeof ListEditorExports.AffixListEditor).toBe('function');
    });

    it('should export BuffListEditor', () => {
      expect(ListEditorExports.BuffListEditor).toBeDefined();
      expect(typeof ListEditorExports.BuffListEditor).toBe('function');
    });

    it('should export ItemListEditor', () => {
      expect(ListEditorExports.ItemListEditor).toBeDefined();
      expect(typeof ListEditorExports.ItemListEditor).toBe('function');
    });

    it('should export SpellListEditor', () => {
      expect(ListEditorExports.SpellListEditor).toBeDefined();
      expect(typeof ListEditorExports.SpellListEditor).toBe('function');
    });
  });

  describe('Module integrity', () => {
    it('should export expected number of editors', () => {
      const exports = Object.keys(ListEditorExports);
      expect(exports.length).toBe(4);
    });

    it('should not export undefined values', () => {
      Object.values(ListEditorExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export only expected editor names', () => {
      const exports = Object.keys(ListEditorExports);
      expect(exports).toEqual(expect.arrayContaining(['AffixListEditor', 'BuffListEditor', 'ItemListEditor', 'SpellListEditor']));
    });
  });
});
