/**
 * @fileoverview Icon Map Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/iconMap.test
 */

import { SEARCH_CONTENT_TYPES } from '@/modules/search/domain';
import { typeIconMap } from '@/modules/search/presentation/atoms/iconMap';
import { describe, expect, it } from 'vitest';

describe('typeIconMap', () => {
  it('should map every content type to an icon component', () => {
    for (const type of SEARCH_CONTENT_TYPES) {
      expect(typeIconMap[type]).toBeDefined();
    }
  });

  it('should not contain unknown keys', () => {
    const known = new Set<string>(SEARCH_CONTENT_TYPES);
    for (const key of Object.keys(typeIconMap)) {
      expect(known.has(key)).toBe(true);
    }
  });
});
