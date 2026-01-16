/**
 * getContentFolder Utility Unit Tests
 *
 * @fileoverview Tests for the getContentFolder utility that constructs
 * absolute paths to locale-specific content directories.
 *
 * @module tests/unit/lib/utils/getContentFolder
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires path Node.js path module
 * @requires @/lib/utils/getContentFolder Module under test
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { getContentFolder } from '@/lib/utils/getContentFolder';

describe('getContentFolder', () => {
  describe('default behavior', () => {
    it('should return English content folder when no locale specified', () => {
      const result = getContentFolder();
      expect(result).toContain('src');
      expect(result).toContain('content');
      expect(result).toContain('en');
    });

    it('should return an absolute path', () => {
      const result = getContentFolder();
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('locale parameter handling', () => {
    it('should return English content folder for en locale', () => {
      const result = getContentFolder('en');
      expect(result).toContain(path.join('src', 'content', 'en'));
    });

    it('should return Spanish content folder for es locale', () => {
      const result = getContentFolder('es');
      expect(result).toContain(path.join('src', 'content', 'es'));
    });

    it('should return Finnish content folder for fi locale', () => {
      const result = getContentFolder('fi');
      expect(result).toContain(path.join('src', 'content', 'fi'));
    });

    it('should handle unsupported locale parameter gracefully', () => {
      const result = getContentFolder('de');
      expect(result).toContain(path.join('src', 'content', 'de'));
    });
  });

  describe('path structure', () => {
    it('should construct path using process.cwd() as base', () => {
      const result = getContentFolder('en');
      expect(result).toContain(process.cwd());
    });

    it('should join path segments correctly', () => {
      const result = getContentFolder('en');
      const expected = path.join(process.cwd(), 'src', 'content', 'en');
      expect(result).toBe(expected);
    });

    it('should produce consistent results across multiple calls', () => {
      const result1 = getContentFolder('en');
      const result2 = getContentFolder('en');
      expect(result1).toBe(result2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string locale by using it literally', () => {
      const result = getContentFolder('');
      expect(result).toBe(path.join(process.cwd(), 'src', 'content', ''));
    });
  });
});
