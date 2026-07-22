/**
 * @fileoverview Featured Pages Unit Tests
 * @module tests/unit/src/modules/search/domain/featuredPages
 */

import {
  FEATURED_PAGES,
  pickFeaturedPage,
} from '@/modules/search/domain/featuredPages';
import { describe, expect, it } from 'vitest';

describe('FEATURED_PAGES', () => {
  it('should contain at least one entry with title, path, and kind', () => {
    expect(FEATURED_PAGES.length).toBeGreaterThan(0);
    for (const page of FEATURED_PAGES) {
      expect(page.title).toBeTruthy();
      expect(page.path).toBeTruthy();
      expect(page.kind).toBeTruthy();
    }
  });
});

describe('pickFeaturedPage', () => {
  it('should return a member of FEATURED_PAGES', () => {
    const pick = pickFeaturedPage();
    expect(FEATURED_PAGES).toContain(pick);
  });

  it('should be stable within the same hour', () => {
    expect(pickFeaturedPage()).toBe(pickFeaturedPage());
  });
});
