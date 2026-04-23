/**
 * @fileoverview Smoke tests for the SEO module barrel export.
 *
 * Verifies that all expected public exports are present and of the correct
 * type so that import regressions are caught early.
 *
 * @module tests/unit/src/lib/seo/index.test
 */

import * as seoModule from '@/lib/seo';
import { describe, expect, it } from 'vitest';

describe('seo barrel export', () => {
  it('exports buildPageMetadata as a function', () => {
    expect(typeof seoModule.buildPageMetadata).toBe('function');
  });

  it('exports extractDescriptionFromMdx as a function', () => {
    expect(typeof seoModule.extractDescriptionFromMdx).toBe('function');
  });

  it('exports resolveMetadataBase as a function', () => {
    expect(typeof seoModule.resolveMetadataBase).toBe('function');
  });

  it('exports resolvePageImage as a function', () => {
    expect(typeof seoModule.resolvePageImage).toBe('function');
  });
});
