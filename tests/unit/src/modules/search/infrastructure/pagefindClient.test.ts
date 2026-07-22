/**
 * @fileoverview Pagefind Client Loader Unit Tests
 * @module tests/unit/src/modules/search/infrastructure/pagefindClient
 */

import { getPagefind } from '@/modules/search/infrastructure/pagefindClient';
import { describe, expect, it } from 'vitest';

describe('pagefindClient', () => {
  describe('getPagefind', () => {
    it('should return null when window is undefined (SSR)', async () => {
      const result = await getPagefind('en');
      expect(result).toBeNull();
    });
  });
});
