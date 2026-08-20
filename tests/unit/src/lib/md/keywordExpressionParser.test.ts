/**
 * @fileoverview keywordExpressionParser Unit Tests
 * @description Tests for parsing `[# kw:... #]` keyword blocks and for the
 * keyword registry lookup semantics.
 *
 * @module tests/unit/lib/md/keywordExpressionParser
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordExpressionParser Parser under test
 */

import {
  KEYWORD_EXPR_REGEX,
  parseKeywordExpression,
} from '@/lib/md/keywordExpressionParser';
import { describe, expect, it } from 'vitest';

describe('KEYWORD_EXPR_REGEX', () => {
  it('should match a keyword block', () => {
    KEYWORD_EXPR_REGEX.lastIndex = 0;
    const match = KEYWORD_EXPR_REGEX.exec('uses [# kw:accuracy #] here');
    expect(match?.[1]).toBe('kw:accuracy');
  });

  it('should leave unit blocks unmatched', () => {
    KEYWORD_EXPR_REGEX.lastIndex = 0;
    expect(KEYWORD_EXPR_REGEX.exec('[= 6 stride =]')).toBeNull();
  });
});

describe('parseKeywordExpression', () => {
  it('should parse a registered keyword', () => {
    expect(parseKeywordExpression('kw:accuracy')).toEqual({
      term: 'accuracy',
      display: 'accuracy',
    });
  });

  it('should preserve author casing in display', () => {
    expect(parseKeywordExpression('kw:Briefly')).toEqual({
      term: 'briefly',
      display: 'Briefly',
    });
  });

  it('should parse multi-word keywords', () => {
    expect(parseKeywordExpression('kw:damage bonus')).toEqual({
      term: 'damage bonus',
      display: 'damage bonus',
    });
  });

  it('should tolerate whitespace after the marker', () => {
    expect(parseKeywordExpression('kw: accuracy')).toEqual({
      term: 'accuracy',
      display: 'accuracy',
    });
  });

  it.each([
    ['unregistered keyword', 'kw:swiftness'],
    ['missing kw: marker', 'accuracy'],
    ['empty expression', ''],
    ['marker with no keyword', 'kw:'],
  ])('should return null for %s', (_label, input) => {
    expect(parseKeywordExpression(input)).toBeNull();
  });
});
