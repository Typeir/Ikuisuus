/**
 * deduplicateFiles Utility Unit Tests
 *
 * @fileoverview Tests deduplicateFiles, which keeps longer variants of files sharing a base name.
 *
 * @module tests/unit/src/lib/utils/deduplicateFiles.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/deduplicateFiles Module under test
 */

import { describe, it, expect } from 'vitest';
import { deduplicateFiles } from '@/lib/utils/deduplicateFiles';

describe('deduplicateFiles', () => {
  describe('basic deduplication', () => {
    it('should return single file unchanged', () => {
      expect(deduplicateFiles(['file.mdx'])).toEqual(['file.mdx']);
    });

    it('should return unique files unchanged', () => {
      const files = ['apple.mdx', 'banana.mdx', 'cherry.mdx'];
      expect(deduplicateFiles(files)).toEqual(files);
    });

    it('should keep longer variant when same base name exists', () => {
      const files = ['entry.mdx', 'entry.sheet.mdx'];
      expect(deduplicateFiles(files)).toEqual(['entry.sheet.mdx']);
    });
  });

  describe('variant preference', () => {
    it('should prefer .sheet.mdx over .mdx', () => {
      const files = ['dragon.mdx', 'dragon.sheet.mdx'];
      expect(deduplicateFiles(files)).toEqual(['dragon.sheet.mdx']);
    });

    it('should prefer .metadata.json over .json', () => {
      const files = ['spell.json', 'spell.metadata.json'];
      expect(deduplicateFiles(files)).toEqual(['spell.metadata.json']);
    });

    it('should prefer longer name regardless of order in sorted array', () => {
      const files = ['file.a', 'file.ab'];
      expect(deduplicateFiles(files)).toEqual(['file.ab']);
    });
  });

  describe('mixed file handling', () => {
    it('should keep both when base names differ', () => {
      const files = ['dragon.mdx', 'dragon.sheet.mdx', 'goblin.mdx'];
      expect(deduplicateFiles(files)).toEqual(['dragon.sheet.mdx', 'goblin.mdx']);
    });

    it('should process multiple duplicates correctly', () => {
      const files = ['a.mdx', 'a.sheet.mdx', 'b.mdx', 'b.sheet.mdx'];
      expect(deduplicateFiles(files)).toEqual(['a.sheet.mdx', 'b.sheet.mdx']);
    });

    it('should handle non-duplicate files interspersed', () => {
      const files = ['alpha.mdx', 'alpha.sheet.mdx', 'beta.mdx', 'gamma.mdx', 'gamma.sheet.mdx'];
      expect(deduplicateFiles(files)).toEqual(['alpha.sheet.mdx', 'beta.mdx', 'gamma.sheet.mdx']);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(deduplicateFiles([])).toEqual([]);
    });

    it('should handle files without extensions', () => {
      const files = ['README', 'README.md'];
      expect(deduplicateFiles(files)).toEqual(['README.md']);
    });

    it('should handle very similar names that are not duplicates', () => {
      const files = ['dragon-red.mdx', 'dragon-red.sheet.mdx', 'dragon-red-ancient.mdx'];
      expect(deduplicateFiles(files)).toEqual(['dragon-red.sheet.mdx', 'dragon-red-ancient.mdx']);
    });
  });

  describe('sorted input assumption', () => {
    it('should work correctly with alphabetically sorted input', () => {
      const files = ['albedo.mdx', 'albedo.sheet.mdx', 'basilisk.mdx'];
      expect(deduplicateFiles(files)).toEqual(['albedo.sheet.mdx', 'basilisk.mdx']);
    });
  });
});
