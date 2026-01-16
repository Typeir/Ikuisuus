/**
 * @fileoverview Tests for MDX Precompilation Loader (Deprecated)
 * @module tests/unit/src/lib/mdx/loadCompileMdx
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/mdx/loadCompileMdx
 */

import { describe, it, expect } from 'vitest';
import * as LoadCompileMdx from '@/lib/mdx/loadCompileMdx';

describe('loadCompileMdx (deprecated)', () => {
  describe('Module structure', () => {
    it('should import without errors', () => {
      expect(LoadCompileMdx).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof LoadCompileMdx).toBe('object');
    });

    it('should have no active exports (deprecated)', () => {
      const exports = Object.keys(LoadCompileMdx);
      expect(exports.length).toBe(0);
    });
  });
});
