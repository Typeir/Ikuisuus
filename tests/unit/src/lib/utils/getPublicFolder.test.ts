/**
 * getPublicFolder Utility Unit Tests
 *
 * @fileoverview Tests for the getPublicFolder utility that constructs the
 * absolute path to the project's `public/` directory.
 *
 * @module tests/unit/src/lib/utils/getPublicFolder.test
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 *
 * @requires vitest Testing framework
 * @requires path Node.js path module
 * @requires @/lib/utils/getPublicFolder Module under test
 */

import { describe, it, expect } from 'vitest';
import path from 'path';

import { getPublicFolder } from '@/lib/utils/getPublicFolder';

describe('getPublicFolder', () => {
  describe('return value', () => {
    it('should return an absolute path', () => {
      const result = getPublicFolder();
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should contain the public directory segment', () => {
      const result = getPublicFolder();
      expect(result).toContain('public');
    });

    it('should be rooted at process.cwd()', () => {
      const result = getPublicFolder();
      expect(result).toContain(process.cwd());
    });

    it('should equal process.cwd() joined with public', () => {
      const result = getPublicFolder();
      const expected = path.join(process.cwd(), 'public');
      expect(result).toBe(expected);
    });
  });

  describe('stability', () => {
    it('should produce consistent results across multiple calls', () => {
      const result1 = getPublicFolder();
      const result2 = getPublicFolder();
      expect(result1).toBe(result2);
    });
  });
});
