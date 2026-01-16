/**
 * getBaseName Utility Unit Tests
 *
 * @fileoverview Tests for filename base name extraction utility.
 * Validates extraction of file name portion before first extension.
 *
 * @module tests/unit/lib/utils/getBaseName
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/getBaseName Module under test
 */

import { describe, it, expect } from 'vitest';
import { getBaseName } from '@/lib/utils/getBaseName';

describe('getBaseName', () => {
  describe('single extension handling', () => {
    it('should extract base name from .mdx file', () => {
      expect(getBaseName('example.mdx')).toBe('example');
    });

    it('should extract base name from .md file', () => {
      expect(getBaseName('document.md')).toBe('document');
    });

    it('should extract base name from .json file', () => {
      expect(getBaseName('config.json')).toBe('config');
    });
  });

  describe('multiple extension handling', () => {
    it('should return portion before first dot for .sheet.mdx', () => {
      expect(getBaseName('character.sheet.mdx')).toBe('character');
    });

    it('should return portion before first dot for .metadata.json', () => {
      expect(getBaseName('monster.metadata.json')).toBe('monster');
    });

    it('should handle triple extensions', () => {
      expect(getBaseName('file.test.spec.ts')).toBe('file');
    });
  });

  describe('edge cases', () => {
    it('should return full string for file without extension', () => {
      expect(getBaseName('README')).toBe('README');
    });

    it('should return empty string for file starting with dot', () => {
      expect(getBaseName('.gitignore')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(getBaseName('')).toBe('');
    });

    it('should handle names with hyphens', () => {
      expect(getBaseName('ancient-red-dragon.sheet.mdx')).toBe('ancient-red-dragon');
    });

    it('should handle names with underscores', () => {
      expect(getBaseName('my_file_name.txt')).toBe('my_file_name');
    });
  });

  describe('real-world content file names', () => {
    it('should handle monster sheet files', () => {
      expect(getBaseName('albedo-the-bleak-bloom.sheet.mdx')).toBe('albedo-the-bleak-bloom');
    });

    it('should handle heirloom files', () => {
      expect(getBaseName('blackbone-crusher.mdx')).toBe('blackbone-crusher');
    });

    it('should handle metadata files', () => {
      expect(getBaseName('fireball.metadata.json')).toBe('fireball');
    });
  });
});
