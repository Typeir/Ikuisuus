/**
 * @fileoverview Native Measure Normalisation
 * @description Rewrites a measurement written for prose into the bare native
 * form that metadata should carry, and splits that form back apart for display.
 *
 * A stat block writes its reach as `[= 12 stride =]`, which is authoring syntax:
 * the delimiters exist so `remarkUnit` can find the measure in an MDX document.
 * Storing them verbatim put markdown into the data, so a table cell rendered the
 * literal text `[= 12 stride =]` and a reader who preferred metres got nothing —
 * the value was never a measurement, it was a fragment of source.
 *
 * The stored form is the inner expression alone, `12 stride`, which is exactly
 * the grammar `parseUnitExpression` accepts. That keeps one parser for both
 * sides: the generator writes what the renderer reads.
 *
 * Surrounding prose survives. A range reads `Self ([= 6 stride;ADJ =] cone)` and
 * a speed reads `[= 8 stride =], burrow [= 4 stride =]` — the words carry meaning
 * the number does not, so only the measures are rewritten.
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
 * Imperial quantities that appear in content written before the native units
 * settled, and the native unit each converts into.
 *
 * These are authoring slips rather than a supported form — four spells state a
 * range in feet and one item states a weight in pounds. Converting them here
 * rather than leaving them alone means a reader on metric sees a metric answer
 * instead of an imperial one that ignored the preference entirely.
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
 * A bare native measure inside an already-normalised string.
 *
 * Mirrors the grammar `parseUnitExpression` accepts, so whatever this matches
 * that parser can read.
 *
 * @constant
 */
export const NATIVE_MEASURE =
  /\b(\d+(?:\s*\/\s*\d+)?)\s+(stride|league|burden|volume)\b(;[A-Z]+(?:,[A-Z]+)*)?/g;

/**
 * Renders a parsed quantity back into the bare expression.
 *
 * Flags are kept. `;ADJ` is what tells the renderer to write "6-stride cone"
 * rather than "6 strides cone", and dropping it would quietly degrade thirteen
 * spell ranges into ungrammatical prose.
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
 * Seven feet is one and two fifths of a stride, and rounding it would state a
 * distance the rules never gave.
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
 * Idempotent: a string that already holds bare measures is returned unchanged,
 * so a generator may call this on a value it has already normalised.
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
 * The renderer walks these and draws each measure through the same component
 * the MDX pipeline uses, so a value in a table converts exactly as the same
 * value converts in an article.
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
 * Same as `toNativeMeasure` except that flags are **dropped**. A name, title or
 * tag is read as-is by things that will never run a renderer over it — an
 * `og:description` meta tag, a search key, a table cell, a section lookup — so a
 * `;ADJ` sitting in the middle of `Aura of Stillness (12 stride;ADJ radius)` is
 * a token leaking into prose, and `Rope ([= 10 stride =])` is worse.
 *
 * The trade is deliberate: an atomic field loses the attributive rendering and
 * keeps its legibility. Measurement fields still use `toNativeMeasure`, which
 * preserves the flag for `Measure` to act on.
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
