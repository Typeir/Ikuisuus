/**
 * Unit Expression Parser
 *
 * @fileoverview Parses a whole or fractional quantity, a unit name, and optional flag shortcodes from `[= ... =]` blocks.
 *
 * @module lib/md/unitExpressionParser
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

/** Regex to match `[= ... =]` delimited unit expressions in text. Non-greedy inner capture. */
export const UNIT_EXPR_REGEX = /\[=\s*(.*?)\s*=\]/g;

/** Regex to match flag shortcodes appended with a semicolon. */
const FLAG_REGEX = /;(ADJ)/g;

/** Regex to match a leading whole or fractional quantity: `6`, `1/5`. */
const QUANTITY_REGEX = /^(\d+)(?:\s*\/\s*(\d+))?/;

/** Regex to match a leading unit name. */
const UNIT_REGEX = /^(stride|league|burden|volume)\b/;

/** Unit names recognised by the parser. */
export type UnitName = 'stride' | 'league' | 'burden' | 'volume';

/**
 * Parsed unit expression result.
 *
 * @interface ParsedUnitExpression
 * @property {number} numerator - Quantity numerator, e.g. 6 for "6", 1 for "1/5"
 * @property {number} denominator - Quantity denominator, 1 for whole quantities
 * @property {UnitName} unit - The unit name
 * @property {string[]} flags - Ordered unique flag shortcodes, e.g. ['ADJ']
 */
export interface ParsedUnitExpression {
  numerator: number;
  denominator: number;
  unit: UnitName;
  flags: string[];
}

/**
 * Extracts flag shortcodes from a string, in order of first appearance.
 * Deduplicates so each shortcode appears at most once.
 *
 * @param {string} text - The text to scan for flag shortcodes
 * @returns {string[]} Ordered unique list of found flags
 */
function extractFlags(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const regex = new RegExp(FLAG_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const code = match[1];
    if (!seen.has(code)) {
      seen.add(code);
      result.push(code);
    }
  }
  return result;
}

/**
 * Strips matched flag shortcodes from the remainder text.
 *
 * @param {string} text - The text to strip flags from
 * @returns {string} Text with all flag shortcodes removed
 */
function stripFlags(text: string): string {
  return text.replace(FLAG_REGEX, '');
}

/**
 * Parses a unit expression from the inner content of a `[= ... =]` block.
 * Returns null for malformed or empty expressions (leaves them as plain text).
 *
 * @param {string} inner - The raw content between `[=` and `=]`, e.g. "6 stride;ADJ"
 * @returns {ParsedUnitExpression | null} Parsed expression or null if malformed
 *
 * @example
 * parseUnitExpression('6 stride')      // { numerator: 6, denominator: 1, unit: 'stride', flags: [] }
 * parseUnitExpression('1/5 stride')    // { numerator: 1, denominator: 5, unit: 'stride', flags: [] }
 * parseUnitExpression('6 stride;ADJ')  // { numerator: 6, denominator: 1, unit: 'stride', flags: ['ADJ'] }
 * parseUnitExpression('6 furlong')     // null — unknown unit
 * parseUnitExpression('stride')        // null — no quantity
 * parseUnitExpression('1/0 stride')    // null — zero denominator
 * parseUnitExpression('')              // null — empty
 */
export function parseUnitExpression(
  inner: string,
): ParsedUnitExpression | null {
  const trimmed = inner.trim();

  if (!trimmed) {
    return null;
  }

  const flags = extractFlags(trimmed);
  const withoutFlags = stripFlags(trimmed).trim();

  const quantityMatch = withoutFlags.match(QUANTITY_REGEX);
  if (!quantityMatch) {
    return null;
  }

  const numerator = Number.parseInt(quantityMatch[1], 10);
  const denominator =
    quantityMatch[2] === undefined ? 1 : Number.parseInt(quantityMatch[2], 10);

  if (denominator === 0) {
    return null;
  }

  const remainder = withoutFlags.slice(quantityMatch[0].length).trim();

  const unitMatch = remainder.match(UNIT_REGEX);
  if (!unitMatch) {
    return null;
  }

  if (remainder.slice(unitMatch[0].length).trim() !== '') {
    return null;
  }

  return {
    numerator,
    denominator,
    unit: unitMatch[1] as UnitName,
    flags,
  };
}
