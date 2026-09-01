/**
 * @fileoverview plainSummary tests
 * @description Verifies shortcode resolution + inline-markdown stripping +
 * whitespace collapse, and word-count truncation with an ellipsis.
 *
 * @module tests/unit/src/lib/utils/plainSummary.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { toPlainSummary, truncateWords } from '@/lib/utils/plainSummary';
import { describe, expect, it } from 'vitest';

describe('toPlainSummary', () => {
  it('resolves shortcodes, strips inline markdown, and collapses whitespace', () => {
    expect(toPlainSummary('Deal [% 2d6 %] **fire**\n  damage')).toBe(
      'Deal 2d6 fire damage',
    );
    expect(toPlainSummary('a [link](/x) and `code`')).toBe('a link and code');
  });

  it('clears stray unpaired bold markers', () => {
    expect(toPlainSummary('**Great Weapon Fighting** style')).toBe(
      'Great Weapon Fighting style',
    );
  });
});

describe('truncateWords', () => {
  it('keeps text at or under the limit unchanged', () => {
    expect(truncateWords('one two three', 5)).toBe('one two three');
    expect(truncateWords('one two three', 3)).toBe('one two three');
  });

  it('truncates over the limit and appends an ellipsis', () => {
    expect(truncateWords('a b c d e', 3)).toBe('a b c…');
  });
});
