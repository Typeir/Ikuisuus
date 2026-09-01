/**
 * @fileoverview searchHref Tests
 * @description URL shape for query + aspect filters.
 *
 * @module tests/unit/src/modules/search/domain/searchHref.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { searchHref } from '@/modules/search/domain/searchHref';
import { describe, expect, it } from 'vitest';

describe('searchHref', () => {
  it('should build the bare search path with nothing', () => {
    expect(searchHref('en', '  ', [])).toBe('/en/search');
  });

  it('should carry the query and repeated aspect params, deduplicated', () => {
    expect(searchHref('en', ' fire ', ['form:blade', 'damage:fire', 'form:blade'])).toBe(
      '/en/search?q=fire&aspect=form%3Ablade&aspect=damage%3Afire',
    );
  });
});
