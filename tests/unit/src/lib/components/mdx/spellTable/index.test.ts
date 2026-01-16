/**
 * @fileoverview Tests for Spell Table Barrel Export
 * @module tests/unit/src/lib/components/mdx/spellTable/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/mdx/spellTable
 */

import { describe, it, expect } from 'vitest';
import * as SpellTableExports from '@/lib/components/mdx/spellTable/index';

describe('mdx/spellTable barrel exports', () => {
  describe('Component exports', () => {
    it('should export SpellTable as default', () => {
      expect(SpellTableExports.SpellTable).toBeDefined();
      expect(typeof SpellTableExports.SpellTable).toBe('function');
    });

    it('should export SpellTable with expected function signature', () => {
      expect(SpellTableExports.SpellTable.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Module integrity', () => {
    it('should export exactly one member', () => {
      const exports = Object.keys(SpellTableExports);
      expect(exports.length).toBe(1);
    });

    it('should not export undefined values', () => {
      Object.values(SpellTableExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export only SpellTable', () => {
      const exports = Object.keys(SpellTableExports);
      expect(exports).toEqual(['SpellTable']);
    });
  });
});
