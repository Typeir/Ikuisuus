/**
 * @fileoverview unitConversion Unit Tests
 * @description Tests for conversion of Damocles measures into reader-facing
 * display systems, covering scaling, half-up rounding, pluralisation, and
 * attributive forms.
 *
 * @module tests/unit/lib/units/unitConversion
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/units/unitConversion Module under test
 */

import {
  allUnitRenderings,
  convertUnit,
  formatUnit,
} from '@/lib/units/unitConversion';
import { describe, expect, it } from 'vitest';

describe('unitConversion', () => {
  describe('stride distances', () => {
    it('should leave native strides unscaled', () => {
      expect(convertUnit(6, 'stride', 'stride').value).toBe(6);
    });

    it('should double strides for metres', () => {
      expect(convertUnit(6, 'stride', 'metric').value).toBe(12);
    });

    it('should quintuple strides for feet', () => {
      expect(convertUnit(6, 'stride', 'imperial').value).toBe(30);
    });

    it.each([
      [1, 5],
      [2, 10],
      [3, 15],
      [6, 30],
      [12, 60],
      [24, 120],
      [60, 300],
      [120, 600],
    ])('should convert %i strides to %i feet', (strides, feet) => {
      expect(convertUnit(strides, 'stride', 'imperial').value).toBe(feet);
    });
  });

  describe('leagues', () => {
    it('should double leagues for kilometres', () => {
      expect(convertUnit(3, 'league', 'metric').value).toBe(6);
    });

    it('should convert four leagues to five miles exactly', () => {
      expect(convertUnit(4, 'league', 'imperial').value).toBe(5);
    });

    it('should round three leagues up to four miles', () => {
      expect(convertUnit(3, 'league', 'imperial').value).toBe(4);
    });

    it('should round one league down to one mile', () => {
      expect(convertUnit(1, 'league', 'imperial').value).toBe(1);
    });
  });

  describe('burdens and volumes', () => {
    it('should keep burdens as kilograms', () => {
      expect(convertUnit(30, 'burden', 'metric').value).toBe(30);
    });

    it('should double burdens for pounds', () => {
      expect(convertUnit(30, 'burden', 'imperial').value).toBe(60);
    });

    it('should keep volumes as litres', () => {
      expect(convertUnit(2, 'volume', 'metric').value).toBe(2);
    });

    it('should double volumes for pints', () => {
      expect(convertUnit(2, 'volume', 'imperial').value).toBe(4);
    });
  });

  describe('no decimals ever escape', () => {
    it.each([1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29])(
      'should yield a whole number of miles for %i leagues',
      (leagues) => {
        const { value } = convertUnit(leagues, 'league', 'imperial');
        expect(Number.isInteger(value)).toBe(true);
      },
    );
  });

  describe('pluralisation', () => {
    it('should use the singular noun for one', () => {
      expect(convertUnit(1, 'stride', 'stride').noun).toBe('stride');
    });

    it('should use the plural noun above one', () => {
      expect(convertUnit(2, 'stride', 'stride').noun).toBe('strides');
    });

    it('should use feet as the plural of foot', () => {
      expect(convertUnit(6, 'stride', 'imperial').noun).toBe('feet');
    });
  });

  describe('formatUnit', () => {
    it('should render a plain measure', () => {
      expect(formatUnit(6, 'stride', 'stride', false)).toBe('6 strides');
    });

    it('should render metric', () => {
      expect(formatUnit(6, 'stride', 'metric', false)).toBe('12 metres');
    });

    it('should render imperial', () => {
      expect(formatUnit(6, 'stride', 'imperial', false)).toBe('30 feet');
    });

    it('should hyphenate and singularise the attributive form', () => {
      expect(formatUnit(6, 'stride', 'stride', true)).toBe('6-stride');
    });

    it('should use foot rather than feet in attributive position', () => {
      expect(formatUnit(6, 'stride', 'imperial', true)).toBe('30-foot');
    });
  });

  describe('allUnitRenderings', () => {
    it('should return all three systems in a fixed order', () => {
      expect(allUnitRenderings(6, 'stride', false)).toEqual([
        '6 strides',
        '12 metres',
        '30 feet',
      ]);
    });

    it('should return attributive forms when requested', () => {
      expect(allUnitRenderings(6, 'stride', true)).toEqual([
        '6-stride',
        '12-metre',
        '30-foot',
      ]);
    });
  });
});
