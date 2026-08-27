/**
 * @fileoverview keywordExpressionParser Unit Tests
 * @description Tests for splitting `[# kw:... #]` keyword blocks into their
 * namespace, value and display parts.
 *
 * @module tests/unit/lib/md/keywordExpressionParser
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-19
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordExpressionParser Parser under test
 */

import {
  KEYWORD_EXPR_REGEX,
  normalizeKeyword,
  parseKeywordReference,
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

describe('normalizeKeyword', () => {
  it('should lowercase and trim', () => {
    expect(normalizeKeyword('  Accuracy ')).toBe('accuracy');
  });

  it('should collapse inner whitespace', () => {
    expect(normalizeKeyword('damage   bonus')).toBe('damage bonus');
  });
});

describe('parseKeywordReference namespaced', () => {
  it('should split a namespaced reference on the semicolon', () => {
    expect(parseKeywordReference('kw:condition;prone')).toEqual({
      namespace: 'condition',
      value: 'prone',
      display: 'prone',
    });
  });

  it('should preserve author casing in display', () => {
    expect(parseKeywordReference('kw:condition;Prone')).toEqual({
      namespace: 'condition',
      value: 'prone',
      display: 'Prone',
    });
  });

  it('should lowercase the namespace', () => {
    expect(parseKeywordReference('kw:Condition;prone')?.namespace).toBe(
      'condition',
    );
  });

  it('should not require the value to be registered', () => {
    expect(parseKeywordReference('kw:condition;unregistered-thing')).toEqual({
      namespace: 'condition',
      value: 'unregistered-thing',
      display: 'unregistered-thing',
    });
  });

  it('should tolerate whitespace around the separator', () => {
    expect(parseKeywordReference('kw:  condition ; prone  ')).toEqual({
      namespace: 'condition',
      value: 'prone',
      display: 'prone',
    });
  });

  it('should keep multi-word values intact', () => {
    expect(parseKeywordReference('kw:mechanic;damage bonus')).toEqual({
      namespace: 'mechanic',
      value: 'damage bonus',
      display: 'damage bonus',
    });
  });

  it('should return null for an empty namespace', () => {
    expect(parseKeywordReference('kw:;prone')).toBeNull();
  });

  it('should return null for an empty value', () => {
    expect(parseKeywordReference('kw:condition;')).toBeNull();
  });

  it('should split on the first separator only', () => {
    expect(parseKeywordReference('kw:condition;a;b')).toEqual({
      namespace: 'condition',
      value: 'a;b',
      display: 'a;b',
    });
  });
});

describe('parseKeywordReference bare', () => {
  it('should parse a bare term', () => {
    expect(parseKeywordReference('kw:accuracy')).toEqual({
      value: 'accuracy',
      display: 'accuracy',
    });
  });

  it('should preserve author casing in display', () => {
    expect(parseKeywordReference('kw:Briefly')).toEqual({
      value: 'briefly',
      display: 'Briefly',
    });
  });

  it('should parse multi-word terms', () => {
    expect(parseKeywordReference('kw:damage bonus')).toEqual({
      value: 'damage bonus',
      display: 'damage bonus',
    });
  });

  it('should tolerate whitespace after the marker', () => {
    expect(parseKeywordReference('kw: accuracy')).toEqual({
      value: 'accuracy',
      display: 'accuracy',
    });
  });

  it('should parse a term with no registry entry', () => {
    expect(parseKeywordReference('kw:resist')).toEqual({
      value: 'resist',
      display: 'resist',
    });
  });

  it.each([
    ['missing kw: marker', 'accuracy'],
    ['empty expression', ''],
    ['marker with no keyword', 'kw:'],
  ])('should return null for %s', (_label, input) => {
    expect(parseKeywordReference(input)).toBeNull();
  });
});
