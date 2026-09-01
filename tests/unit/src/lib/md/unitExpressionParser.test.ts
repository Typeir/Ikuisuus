/**
 * @fileoverview unitExpressionParser Unit Tests
 * @description Tests for the pure parser of `[= ... =]` unit expression syntax,
 * covering whole and fractional quantities, unit names, flags, and malformed input.
 *
 * @module tests/unit/src/lib/md/unitExpressionParser.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/unitExpressionParser Parser under test
 */

import {
  parseUnitExpression,
  UNIT_EXPR_REGEX,
} from '@/lib/md/unitExpressionParser';
import { describe, expect, it } from 'vitest';

describe('unitExpressionParser', () => {
  describe('exports', () => {
    it('should export the parser function', () => {
      expect(typeof parseUnitExpression).toBe('function');
    });

    it('should export a global delimiter regex', () => {
      expect(UNIT_EXPR_REGEX).toBeInstanceOf(RegExp);
      expect(UNIT_EXPR_REGEX.global).toBe(true);
    });
  });

  describe('delimiter regex', () => {
    it('should match a single expression', () => {
      UNIT_EXPR_REGEX.lastIndex = 0;
      const matches = [...'move [= 6 stride =] north'.matchAll(UNIT_EXPR_REGEX)];
      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('6 stride');
    });

    it('should match multiple expressions in one string', () => {
      UNIT_EXPR_REGEX.lastIndex = 0;
      const matches = [
        ...'[= 6 stride =] and [= 30 burden =]'.matchAll(UNIT_EXPR_REGEX),
      ];
      expect(matches).toHaveLength(2);
    });

    it('should not match dice delimiters', () => {
      UNIT_EXPR_REGEX.lastIndex = 0;
      const matches = [...'[% 3d8 fire %]'.matchAll(UNIT_EXPR_REGEX)];
      expect(matches).toHaveLength(0);
    });
  });

  describe('whole quantities', () => {
    it('should parse a whole stride quantity', () => {
      expect(parseUnitExpression('6 stride')).toEqual({
        numerator: 6,
        denominator: 1,
        unit: 'stride',
        flags: [],
      });
    });

    it.each(['stride', 'league', 'burden', 'volume'])(
      'should parse the %s unit',
      (unit) => {
        const result = parseUnitExpression(`2 ${unit}`);
        expect(result?.unit).toBe(unit);
      },
    );

    it('should parse large quantities', () => {
      expect(parseUnitExpression('600 stride')?.numerator).toBe(600);
    });

    it('should tolerate surrounding whitespace', () => {
      expect(parseUnitExpression('   6    stride   ')).toEqual({
        numerator: 6,
        denominator: 1,
        unit: 'stride',
        flags: [],
      });
    });
  });

  describe('fractional quantities', () => {
    it('should parse a fraction', () => {
      expect(parseUnitExpression('1/5 stride')).toEqual({
        numerator: 1,
        denominator: 5,
        unit: 'stride',
        flags: [],
      });
    });

    it('should parse a fraction with spaces around the solidus', () => {
      expect(parseUnitExpression('3 / 4 stride')).toMatchObject({
        numerator: 3,
        denominator: 4,
      });
    });

    it('should treat a denominator of one as whole', () => {
      expect(parseUnitExpression('2/1 burden')?.denominator).toBe(1);
    });
  });

  describe('flags', () => {
    it('should parse the ADJ flag', () => {
      expect(parseUnitExpression('6 stride;ADJ')).toEqual({
        numerator: 6,
        denominator: 1,
        unit: 'stride',
        flags: ['ADJ'],
      });
    });

    it('should deduplicate repeated flags', () => {
      expect(parseUnitExpression('6 stride;ADJ;ADJ')?.flags).toEqual(['ADJ']);
    });

    it('should parse flags on fractional quantities', () => {
      expect(parseUnitExpression('1/2 stride;ADJ')).toMatchObject({
        numerator: 1,
        denominator: 2,
        flags: ['ADJ'],
      });
    });
  });

  describe('malformed input returns null', () => {
    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['no quantity', 'stride'],
      ['unknown unit', '6 furlong'],
      ['no unit', '6'],
      ['zero denominator', '1/0 stride'],
      ['trailing garbage', '6 stride north'],
      ['unknown flag', '6 stride;NOPE'],
      ['dice expression', '2d20 fire'],
    ])('should return null for %s', (_label, input) => {
      expect(parseUnitExpression(input)).toBeNull();
    });
  });
});
