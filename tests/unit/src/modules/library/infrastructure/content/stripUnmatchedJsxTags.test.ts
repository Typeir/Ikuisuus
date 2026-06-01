/**
 * @fileoverview Unit tests for stripUnmatchedJsxTags helper.
 * @module tests/unit/src/modules/library/infrastructure/content/stripUnmatchedJsxTags
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { stripUnmatchedJsxTags } from '@/modules/library/infrastructure/content/stripUnmatchedJsxTags';
import { describe, expect, it } from 'vitest';

describe('stripUnmatchedJsxTags', () => {
  it('removes unmatched opening tags', () => {
    expect(stripUnmatchedJsxTags('<Meta foo="bar"')).toBe('<Meta foo="bar"');
    expect(stripUnmatchedJsxTags('<Collapsible>text')).toBe('text');
  });

  it('removes unmatched closing tags', () => {
    expect(stripUnmatchedJsxTags('text</Collapsible>')).toBe('text');
  });

  it('keeps balanced tags intact', () => {
    expect(stripUnmatchedJsxTags('<strong>text</strong>')).toBe(
      '<strong>text</strong>',
    );
  });
});
