/**
 * @fileoverview Content-Type Repository Registry Unit Tests
 * @description Asserts every searchable content type resolves to a listable
 * repository.
 *
 * @module tests/unit/src/lib/db/content/repositories/byContentType.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { REPOSITORIES_BY_TYPE } from '@/lib/db/content/repositories/byContentType';
import { SEARCH_CONTENT_TYPES } from '@/modules/search/domain/contentTypes';
import { describe, expect, it } from 'vitest';

describe('REPOSITORIES_BY_TYPE', () => {
  it('binds every searchable content type to a listable repository', () => {
    for (const type of SEARCH_CONTENT_TYPES) {
      expect(REPOSITORIES_BY_TYPE[type]).toBeDefined();
      expect(typeof REPOSITORIES_BY_TYPE[type].list).toBe('function');
    }
  });

  it('binds nothing beyond the searchable taxonomy', () => {
    expect(Object.keys(REPOSITORIES_BY_TYPE).sort()).toEqual(
      [...SEARCH_CONTENT_TYPES].sort(),
    );
  });
});
