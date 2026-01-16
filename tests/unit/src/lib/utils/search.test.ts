/**
 * searchContent Utility Unit Tests
 *
 * @fileoverview Tests for content search utility exports and structure.
 * Full integration testing with filesystem is handled by e2e tests.
 *
 * @module tests/unit/lib/utils/search
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/search Module under test
 */

import { describe, it, expect } from 'vitest';
import * as SearchModule from '@/lib/utils/search';

describe('searchContent', () => {
  describe('exports', () => {
    it('should export searchContent function', () => {
      expect(SearchModule.searchContent).toBeDefined();
      expect(typeof SearchModule.searchContent).toBe('function');
    });

    it('should accept query parameter', () => {
      expect(SearchModule.searchContent.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('async behavior', () => {
    it('should return a Promise', () => {
      const result = SearchModule.searchContent('test');

      expect(result).toBeInstanceOf(Promise);
    });
  });
});
