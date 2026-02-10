/**
 * Unit tests for toCssValue utility
 *
 * @module toCssValue.test
 */

import { describe, it, expect } from 'vitest';
import { toCssValue } from '@/lib/utils/toCssValue';

describe('toCssValue', () => {
  describe('number inputs', () => {
    it('should convert positive numbers to px values', () => {
      expect(toCssValue(10)).toBe('10px');
      expect(toCssValue(100)).toBe('100px');
      expect(toCssValue(1)).toBe('1px');
    });

    it('should convert zero to px value', () => {
      expect(toCssValue(0)).toBe('0px');
    });

    it('should convert negative numbers to px values', () => {
      expect(toCssValue(-10)).toBe('-10px');
      expect(toCssValue(-100)).toBe('-100px');
    });

    it('should convert decimal numbers to px values', () => {
      expect(toCssValue(10.5)).toBe('10.5px');
      expect(toCssValue(0.5)).toBe('0.5px');
      expect(toCssValue(-10.5)).toBe('-10.5px');
    });

    it('should handle very large numbers', () => {
      expect(toCssValue(999999)).toBe('999999px');
    });

    it('should handle very small numbers', () => {
      expect(toCssValue(0.001)).toBe('0.001px');
    });
  });

  describe('string inputs', () => {
    it('should return percentage strings as-is', () => {
      expect(toCssValue('50%')).toBe('50%');
      expect(toCssValue('100%')).toBe('100%');
      expect(toCssValue('0%')).toBe('0%');
    });

    it('should return pixel strings as-is', () => {
      expect(toCssValue('10px')).toBe('10px');
      expect(toCssValue('100px')).toBe('100px');
    });

    it('should return rem values as-is', () => {
      expect(toCssValue('1rem')).toBe('1rem');
      expect(toCssValue('2.5rem')).toBe('2.5rem');
    });

    it('should return em values as-is', () => {
      expect(toCssValue('1em')).toBe('1em');
      expect(toCssValue('2em')).toBe('2em');
    });

    it('should return viewport units as-is', () => {
      expect(toCssValue('50vw')).toBe('50vw');
      expect(toCssValue('100vh')).toBe('100vh');
      expect(toCssValue('50vmin')).toBe('50vmin');
      expect(toCssValue('50vmax')).toBe('50vmax');
    });

    it('should return calc() expressions as-is', () => {
      expect(toCssValue('calc(100% - 20px)')).toBe('calc(100% - 20px)');
    });

    it('should return CSS keywords as-is', () => {
      expect(toCssValue('auto')).toBe('auto');
      expect(toCssValue('inherit')).toBe('inherit');
      expect(toCssValue('initial')).toBe('initial');
    });

    it('should return empty strings as-is', () => {
      expect(toCssValue('')).toBe('');
    });

    it('should return arbitrary strings as-is', () => {
      expect(toCssValue('fit-content')).toBe('fit-content');
      expect(toCssValue('max-content')).toBe('max-content');
    });
  });

  describe('undefined inputs', () => {
    it('should return undefined for undefined input', () => {
      expect(toCssValue(undefined)).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle negative zero', () => {
      expect(toCssValue(-0)).toBe('0px');
    });

    it('should handle scientific notation numbers', () => {
      expect(toCssValue(1e2)).toBe('100px');
      expect(toCssValue(1e-2)).toBe('0.01px');
    });
  });

  describe('type safety', () => {
    it('should accept string | number | undefined', () => {
      const testValues: Array<string | number | undefined> = [
        10,
        '10px',
        undefined,
        0,
        '50%',
      ];

      testValues.forEach((value) => {
        expect(() => toCssValue(value)).not.toThrow();
      });
    });
  });
});
