/**
 * @fileoverview featCategories Tests
 * @module tests/unit/src/modules/library/domain/featCategories.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  FEAT_CATEGORIES,
  featCategoryKey,
} from '@/modules/library/domain/featCategories';
import { describe, expect, it } from 'vitest';

describe('FEAT_CATEGORIES', () => {
  it('should list the authored categories', () => {
    expect(FEAT_CATEGORIES).toEqual(['general', 'origin', 'epic boon']);
  });
});

describe('featCategoryKey', () => {
  it('should lowercase a single word', () => {
    expect(featCategoryKey('General')).toBe('general');
    expect(featCategoryKey('ORIGIN')).toBe('origin');
  });

  it('should camel-case a multi-word category', () => {
    expect(featCategoryKey('Epic Boon')).toBe('epicBoon');
    expect(featCategoryKey('epic boon')).toBe('epicBoon');
  });

  it('should ignore surrounding and repeated whitespace', () => {
    expect(featCategoryKey('  Epic   Boon  ')).toBe('epicBoon');
  });

  it('should produce a key for every authored category', () => {
    expect(FEAT_CATEGORIES.map(featCategoryKey)).toEqual([
      'general',
      'origin',
      'epicBoon',
    ]);
  });
});
