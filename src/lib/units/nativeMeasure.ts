/**
 * @fileoverview Native Measure Normalisation
 * @description Rewrites authoring syntax `[= 12 stride =]` to the bare form
 * `12 stride` that `parseUnitExpression` accepts, and splits that form back into
 * prose and measure segments for display. Prose outside measures is kept as-is.
 *
 * @module lib/units/nativeMeasure
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 */

import {
  parseUnitExpression,
  UNIT_EXPR_REGEX,
  type UnitName,
} from '../md/unitExpressionParser';

/**
 * Imperial authoring slips and the native unit each converts into.
 *
 * @property {RegExp} pattern - Matches the quantity and its imperial unit
 * @property {UnitName} unit - Native unit to convert into
 * @property {number} per - Imperial quantity in one native unit
 */
const IMPERIAL: Array<{ pattern: RegExp; unit: UnitName; per: number }> = [
  { pattern: /(\d+)\s*(?:ft\.?|feet|foot)\b/gi, unit: 'stride', per: 5 },
  { pattern: /(\d+)\s*(?:lbs?\.?|pounds?)\b/gi, unit: 'burden', per: 2 },
  { pattern: /(\d+)\s*(?:pints?)\b/gi, unit: 'volume', per: 2 },
];

/**
 * A bare native measure inside an already-normalised string. Matches the
 * grammar `parseUnitExpression` accepts.
 *
 * @constant
 */
export const NATIVE_MEASURE =
  /\b(\d+(?:\s*\/\s*\d+)?)\s+(stride|league|burden|volume)\b(;[A-Z]+(?:,[A-Z]+)*)?/g;

/**
 * Renders a parsed quantity back into the bare expression.
 *
 * Flags are kept.
 *
 * @param {number} numerator - Quantity numerator
 * @param {number} denominator - Quantity denominator, 1 when whole
 * @param {UnitName} unit - Native unit
 * @param {string[]} flags - Flag shortcodes to preserve
 * @returns {string} The bare expression, e.g. `12 stride` or `6 stride;ADJ`
 */
function bare(
  numerator: number,
  denominator: number,
  unit: UnitName,
  flags: string[],
): string {
  const quantity = denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
  const suffix = flags.length ? `;${flags.join(',')}` : '';
  return `${quantity} ${unit}${suffix}`;
}

/**
 * Reduces a fraction so a converted imperial quantity stays exact.
 *
 * @param {number} numerator - Fraction numerator
 * @param {number} denominator - Fraction denominator
 * @returns {[number, number]} The reduced pair
 */
function reduce(numerator: number, denominator: number): [number, number] {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator) || 1;
  return [numerator / divisor, denominator / divisor];
}

/**
 * Rewrites every measurement in a string into its bare native form.
 *
 * Idempotent: a string that already holds bare measures is returned unchanged.
 *
 * @param {string} text - Measurement text as written in the source
 * @returns {string} The same text with native measures in place of authoring syntax
 *
 * @example
 * toNativeMeasure('[= 12 stride =]')                  // '12 stride'
 * toNativeMeasure('Self ([= 6 stride;ADJ =] cone)')   // 'Self (6 stride;ADJ cone)'
 * toNativeMeasure('60 Feet')                          // '12 stride'
 * toNativeMeasure('Self')                             // 'Self'
 */
export function toNativeMeasure(text: string, keepFlags = true): string {
  const unwrapped = text.replace(
    new RegExp(UNIT_EXPR_REGEX.source, UNIT_EXPR_REGEX.flags),
    (whole, inner: string) => {
      const parsed = parseUnitExpression(inner);
      return parsed
        ? bare(
            parsed.numerator,
            parsed.denominator,
            parsed.unit,
            keepFlags ? parsed.flags : [],
          )
        : whole;
    },
  );

  return IMPERIAL.reduce(
    (carry, { pattern, unit, per }) =>
      carry.replace(
        new RegExp(pattern.source, pattern.flags),
        (whole, quantity: string) => {
          const amount = Number.parseInt(quantity, 10);
          if (!Number.isFinite(amount)) return whole;
          const [numerator, denominator] = reduce(amount, per);
          return bare(numerator, denominator, unit, []);
        },
      ),
    unwrapped,
  );
}

/**
 * One piece of a normalised measurement string.
 *
 * @property {string} text - The literal text of this piece
 * @property {number} [numerator] - Quantity numerator when this piece is a measure
 * @property {number} [denominator] - Quantity denominator when this piece is a measure
 * @property {UnitName} [unit] - Native unit when this piece is a measure
 * @property {string} [flags] - Comma-separated flag shortcodes
 */
export interface MeasureSegment {
  text: string;
  numerator?: number;
  denominator?: number;
  unit?: UnitName;
  flags?: string;
}

/**
 * Splits a normalised measurement string into prose and measures.
 *
 * @param {string} text - A string of bare native measures and prose
 * @returns {MeasureSegment[]} Ordered segments; measures carry a unit
 *
 * @example
 * splitMeasures('Self (6 stride;ADJ cone)')
 * // [{ text: 'Self (' }, { text: '6 stride;ADJ', numerator: 6, … }, { text: ' cone)' }]
 */
export function splitMeasures(text: string): MeasureSegment[] {
  const segments: MeasureSegment[] = [];
  const scanner = new RegExp(NATIVE_MEASURE.source, NATIVE_MEASURE.flags);

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = scanner.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }

    const [quantity, divisor] = match[1].split('/');

    segments.push({
      text: match[0],
      numerator: Number.parseInt(quantity, 10),
      denominator: divisor ? Number.parseInt(divisor, 10) : 1,
      unit: match[2] as UnitName,
      flags: match[3] ? match[3].slice(1) : undefined,
    });

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
}

/**
 * Rewrites every measurement into a form fit for an atomic plaintext field.
 *
 * Same as `toNativeMeasure` except flags are dropped, removing `;ADJ` tokens
 * from the output. Measurement fields use `toNativeMeasure`, which preserves
 * the flag.
 *
 * @param {string} text - Text destined for an atomic plaintext field
 * @returns {string} The same text with plain native measures and no flags
 *
 * @example
 * toPlainMeasure('Rope ([= 10 stride =])')                    // 'Rope (10 stride)'
 * toPlainMeasure('Aura of Stillness ([= 12 stride;ADJ =] radius)')
 * //                                  'Aura of Stillness (12 stride radius)'
 */
export function toPlainMeasure(text: string): string {
  return toNativeMeasure(text, false);
}
