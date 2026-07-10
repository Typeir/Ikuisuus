/**
 * @fileoverview Dice Expression Parser Unit Tests
 * @description Tests for the pure parser that extracts dice expressions
 * from `[% ... %]` syntax in MDX content.
 *
 * @module tests/unit/lib/md/diceExpressionParser
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/diceExpressionParser Module under test
 */

import {
    DICE_EXPR_REGEX,
    parseDiceExpression
} from '@/lib/md/diceExpressionParser';
import { describe, expect, it } from 'vitest';

describe('DICE_EXPR_REGEX', () => {
  it('should match a basic dice expression', () => {
    const text = 'Roll [% 2d20 + 5 fire %] for damage';
    const matches = [...text.matchAll(DICE_EXPR_REGEX)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('2d20 + 5 fire');
  });

  it('should match multiple expressions in one string', () => {
    const text = '[% 2d6 fire %] and [% 1d8 + 3 %]';
    const matches = [...text.matchAll(DICE_EXPR_REGEX)];
    expect(matches).toHaveLength(2);
  });

  it('should not match text without delimiters', () => {
    const text = 'Just 2d20 plain text';
    const matches = [...text.matchAll(DICE_EXPR_REGEX)];
    expect(matches).toHaveLength(0);
  });

  it('should handle empty expression', () => {
    const text = 'Roll [% %] nothing';
    const matches = [...text.matchAll(DICE_EXPR_REGEX)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('');
  });

  it('should handle whitespace-only expression', () => {
    const text = 'Roll [%   %] nothing';
    const matches = [...text.matchAll(DICE_EXPR_REGEX)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('');
  });
});

describe('parseDiceExpression', () => {
  describe('basic dice', () => {
    it('should parse simple dice notation', () => {
      const result = parseDiceExpression('2d20');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('2d20');
      expect(result!.specials).toEqual([]);
      expect(result!.modifier).toBeNull();
      expect(result!.damageType).toBeNull();
    });

    it('should parse dice with modifier', () => {
      const result = parseDiceExpression('2d20 + 5');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('2d20');
      expect(result!.modifier).toBe('+5');
      expect(result!.damageType).toBeNull();
    });

    it('should parse dice with negative modifier', () => {
      const result = parseDiceExpression('1d20 -3');
      expect(result).not.toBeNull();
      expect(result!.modifier).toBe('-3');
    });

    it('should parse dice with damage type', () => {
      const result = parseDiceExpression('3d6 fire');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('3d6');
      expect(result!.damageType).toBe('fire');
    });

    it('should parse full expression with modifier and damage type', () => {
      const result = parseDiceExpression('2d20 + 5 fire damage');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('2d20');
      expect(result!.modifier).toBe('+5');
      expect(result!.damageType).toBe('fire damage');
    });

    it('should parse d100 notation', () => {
      const result = parseDiceExpression('1d100');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('1d100');
    });

    it('should handle whitespace around plus sign in modifier', () => {
      const result = parseDiceExpression('2d6 + 10 slashing');
      expect(result).not.toBeNull();
      expect(result!.modifier).toBe('+10');
    });
  });

  describe('special rolls', () => {
    it('should parse KH1 special', () => {
      const result = parseDiceExpression('2d20;KH1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KH1']);
    });

    it('should parse KL1 special', () => {
      const result = parseDiceExpression('2d20;KL1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KL1']);
    });

    it('should parse DL1 special', () => {
      const result = parseDiceExpression('3d6;DL1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['DL1']);
    });

    it('should parse DH1 special', () => {
      const result = parseDiceExpression('3d6;DH1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['DH1']);
    });

    it('should parse special with modifier', () => {
      const result = parseDiceExpression('2d20;KH1 + 5');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KH1']);
      expect(result!.modifier).toBe('+5');
    });

    it('should parse special with damage type', () => {
      const result = parseDiceExpression('2d20;KH1 fire');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KH1']);
      expect(result!.damageType).toBe('fire');
    });

    it('should parse multiple specials', () => {
      const result = parseDiceExpression('2d20;KH1;DL1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KH1', 'DL1']);
    });

    it('should deduplicate repeated specials', () => {
      const result = parseDiceExpression('2d20;KH1;KH1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['KH1']);
    });

    it('should parse specials in any order', () => {
      const result = parseDiceExpression('2d20;DL1;KH1');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual(['DL1', 'KH1']);
    });

    it('should parse special with modifier and damage type', () => {
      const result = parseDiceExpression('2d20;KH1 + 5 radiant');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('2d20');
      expect(result!.specials).toEqual(['KH1']);
      expect(result!.modifier).toBe('+5');
      expect(result!.damageType).toBe('radiant');
    });
  });

  describe('error handling', () => {
    it('should return null for malformed dice: no number before d', () => {
      expect(parseDiceExpression('d6')).toBeNull();
    });

    it('should return null for malformed dice: no number after d', () => {
      expect(parseDiceExpression('2d')).toBeNull();
    });

    it('should return null for non-dice text', () => {
      expect(parseDiceExpression('abc')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDiceExpression('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(parseDiceExpression('   ')).toBeNull();
    });

    it('should return null for unknown special', () => {
      const result = parseDiceExpression('2d20;XX');
      expect(result).not.toBeNull();
      expect(result!.specials).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle large dice counts', () => {
      const result = parseDiceExpression('60d10 + 420');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('60d10');
      expect(result!.modifier).toBe('+420');
    });

    it('should handle multi-word damage types', () => {
      const result = parseDiceExpression('4d10 chemical damage plus fire');
      expect(result).not.toBeNull();
      expect(result!.damageType).toBe('chemical damage plus fire');
    });

    it('should handle no spaces between tokens', () => {
      const result = parseDiceExpression('2d20;KH1+5fire');
      expect(result).not.toBeNull();
      expect(result!.dice).toBe('2d20');
      expect(result!.specials).toEqual(['KH1']);
      expect(result!.modifier).toBe('+5');
      expect(result!.damageType).toBe('fire');
    });
  });
});
