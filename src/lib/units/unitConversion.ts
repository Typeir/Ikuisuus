/**
 * Unit Conversion
 *
 * @fileoverview Converts Damocles measures into a chosen display system.
 * Whole-number conversions round halves upward. Fractional quantities resolve
 * to prose via the i18n fraction dictionary, not here.
 *
 * @module lib/units/unitConversion
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

import type { UnitName } from '../md/unitExpressionParser';
import type { UnitDimension, UnitSystemValue } from '../types/persistentUiState';

/**
 * Measurement family each unit belongs to.
 *
 * @constant
 */
const UNIT_DIMENSION: Record<UnitName, UnitDimension> = {
  stride: 'distance',
  league: 'distance',
  burden: 'weight',
  volume: 'volume',
};

/**
 * Returns the measurement family a unit belongs to.
 *
 * @param {UnitName} unit - The native unit
 * @returns {UnitDimension} Its measurement family
 *
 * @example
 * dimensionOf('league') // 'distance'
 * dimensionOf('burden') // 'weight'
 */
export function dimensionOf(unit: UnitName): UnitDimension {
  return UNIT_DIMENSION[unit];
}

/**
 * A converted measure ready for display.
 *
 * @interface ConvertedUnit
 * @property {number} value - The converted whole-number quantity
 * @property {string} noun - Unit noun for the quantity, already pluralised
 * @property {string} adjectiveNoun - Singular noun used in attributive position
 */
export interface ConvertedUnit {
  value: number;
  noun: string;
  adjectiveNoun: string;
}

/**
 * Conversion factors and nouns per unit and display system.
 * `numerator` over `denominator` scales the native quantity.
 */
const CONVERSIONS: Record<
  UnitName,
  Record<
    UnitSystemValue,
    {
      numerator: number;
      denominator: number;
      singular: string;
      plural: string;
      adjective: string;
    }
  >
> = {
  stride: {
    stride: {
      numerator: 1,
      denominator: 1,
      singular: 'stride',
      plural: 'strides',
      adjective: 'stride',
    },
    metric: {
      numerator: 2,
      denominator: 1,
      singular: 'metre',
      plural: 'metres',
      adjective: 'metre',
    },
    imperial: {
      numerator: 5,
      denominator: 1,
      singular: 'foot',
      plural: 'feet',
      adjective: 'foot',
    },
  },
  league: {
    stride: {
      numerator: 1,
      denominator: 1,
      singular: 'league',
      plural: 'leagues',
      adjective: 'league',
    },
    metric: {
      numerator: 2,
      denominator: 1,
      singular: 'kilometre',
      plural: 'kilometres',
      adjective: 'kilometre',
    },
    imperial: {
      numerator: 5,
      denominator: 4,
      singular: 'mile',
      plural: 'miles',
      adjective: 'mile',
    },
  },
  burden: {
    stride: {
      numerator: 1,
      denominator: 1,
      singular: 'burden',
      plural: 'burdens',
      adjective: 'burden',
    },
    metric: {
      numerator: 1,
      denominator: 1,
      singular: 'kilogram',
      plural: 'kilograms',
      adjective: 'kilogram',
    },
    imperial: {
      numerator: 2,
      denominator: 1,
      singular: 'pound',
      plural: 'pounds',
      adjective: 'pound',
    },
  },
  volume: {
    stride: {
      numerator: 1,
      denominator: 1,
      singular: 'volume',
      plural: 'volumes',
      adjective: 'volume',
    },
    metric: {
      numerator: 1,
      denominator: 1,
      singular: 'litre',
      plural: 'litres',
      adjective: 'litre',
    },
    imperial: {
      numerator: 2,
      denominator: 1,
      singular: 'pint',
      plural: 'pints',
      adjective: 'pint',
    },
  },
};

/**
 * Rounds a rational quantity to a whole number, rounding halves upward.
 *
 * @param {number} numerator - The numerator of the quantity
 * @param {number} denominator - The denominator of the quantity
 * @returns {number} The whole-number result
 */
function roundHalfUp(numerator: number, denominator: number): number {
  return Math.floor(numerator / denominator + 0.5);
}

/**
 * Converts a whole native quantity into the chosen display system.
 *
 * @param {number} value - The native quantity, a whole number
 * @param {UnitName} unit - The native unit
 * @param {UnitSystemValue} system - The reader's display preference
 * @returns {ConvertedUnit} The converted quantity and its nouns
 *
 * @example
 * convertUnit(6, 'stride', 'stride')    // { value: 6, noun: 'strides', adjectiveNoun: 'stride' }
 * convertUnit(6, 'stride', 'metric')    // { value: 12, noun: 'metres', adjectiveNoun: 'metre' }
 * convertUnit(6, 'stride', 'imperial')  // { value: 30, noun: 'feet', adjectiveNoun: 'foot' }
 * convertUnit(3, 'league', 'imperial')  // { value: 4, noun: 'miles', adjectiveNoun: 'mile' }
 */
export function convertUnit(
  value: number,
  unit: UnitName,
  system: UnitSystemValue,
): ConvertedUnit {
  const conversion = CONVERSIONS[unit][system];
  const converted = roundHalfUp(
    value * conversion.numerator,
    conversion.denominator,
  );

  return {
    value: converted,
    noun: converted === 1 ? conversion.singular : conversion.plural,
    adjectiveNoun: conversion.adjective,
  };
}

/**
 * Renders a converted measure as display text.
 * With the `ADJ` flag the measure is hyphenated for attributive use and the
 * unit noun stays singular.
 *
 * @param {number} value - The native quantity, a whole number
 * @param {UnitName} unit - The native unit
 * @param {UnitSystemValue} system - The reader's display preference
 * @param {boolean} attributive - Whether to render the attributive form
 * @returns {string} Display text, e.g. "6 strides" or "6-stride"
 *
 * @example
 * formatUnit(6, 'stride', 'imperial', false)  // "30 feet"
 * formatUnit(6, 'stride', 'imperial', true)   // "30-foot"
 */
export function formatUnit(
  value: number,
  unit: UnitName,
  system: UnitSystemValue,
  attributive: boolean,
): string {
  const converted = convertUnit(value, unit, system);

  return attributive
    ? `${converted.value}-${converted.adjectiveNoun}`
    : `${converted.value} ${converted.noun}`;
}

/**
 * Greatest common divisor, used to reduce a scaled fraction.
 *
 * @param {number} a - First operand
 * @param {number} b - Second operand
 * @returns {number} The greatest common divisor
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * A fractional measure converted into a display system.
 *
 * @interface ConvertedFraction
 * @property {number} whole - Whole units, zero when the value is under one
 * @property {number} numerator - Remaining fraction numerator, zero when exact
 * @property {number} denominator - Remaining fraction denominator
 * @property {string} noun - Unit noun, pluralised for the whole part
 * @property {string} singularNoun - Unit noun in the singular
 */
export interface ConvertedFraction {
  whole: number;
  numerator: number;
  denominator: number;
  noun: string;
  singularNoun: string;
}

/**
 * Converts a fractional native measure into the chosen display system.
 *
 * Scales the fraction by the conversion factor, reducing it and splitting
 * into a whole part and a remainder.
 *
 * @param {number} numerator - Native fraction numerator
 * @param {number} denominator - Native fraction denominator
 * @param {UnitName} unit - The native unit
 * @param {UnitSystemValue} system - The reader's display preference
 * @returns {ConvertedFraction} The converted, reduced fraction
 *
 * @example
 * convertFraction(1, 5, 'stride', 'stride')   // 1/5 stride
 * convertFraction(1, 5, 'stride', 'metric')   // 2/5 metre
 * convertFraction(1, 5, 'stride', 'imperial') // 1 foot, no remainder
 */
export function convertFraction(
  numerator: number,
  denominator: number,
  unit: UnitName,
  system: UnitSystemValue,
): ConvertedFraction {
  const conversion = CONVERSIONS[unit][system];

  const scaledNumerator = numerator * conversion.numerator;
  const scaledDenominator = denominator * conversion.denominator;

  const divisor = gcd(scaledNumerator, scaledDenominator) || 1;
  const n = scaledNumerator / divisor;
  const d = scaledDenominator / divisor;

  const whole = Math.floor(n / d);
  const remainder = n % d;

  return {
    whole,
    numerator: remainder,
    denominator: remainder === 0 ? 1 : d,
    noun: whole === 1 && remainder === 0 ? conversion.singular : conversion.plural,
    singularNoun: conversion.singular,
  };
}

/**
 * Builds every system's rendering of a measure in fixed stride, metric,
 * imperial order, for use as an accessible label and tooltip.
 *
 * @param {number} value - The native quantity, a whole number
 * @param {UnitName} unit - The native unit
 * @param {boolean} attributive - Whether to render attributive forms
 * @returns {string[]} Renderings ordered stride, metric, imperial
 */
export function allUnitRenderings(
  value: number,
  unit: UnitName,
  attributive: boolean,
): string[] {
  const systems: UnitSystemValue[] = ['stride', 'metric', 'imperial'];
  return systems.map((system) =>
    formatUnit(value, unit, system, attributive),
  );
}
