/**
 * Dice Expression Parser
 *
 * @fileoverview Pure parser for `[% ... %]` dice expression syntax used in MDX content.
 * Parses dice notation (NdM), optional special roll modifiers (KH1, KL1, DL1, DH1),
 * optional signed modifier, and optional damage type description.
 *
 * @module lib/md/diceExpressionParser
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 */

/** Regex to match `[% ... %]` delimited dice expressions in text. Non-greedy inner capture. */
export const DICE_EXPR_REGEX = /\[%\s*(.*?)\s*%\]/g;

/** Regex to match valid special roll type shortcodes: KH1, KL1, DL1, DH1. */
const SPECIAL_REGEX = /;(KH1|KL1|DL1|DH1)/g;

/** Regex to match a signed integer modifier: +N or -N with optional whitespace after sign. */
const MODIFIER_REGEX = /^([+-]\s*\d+)/;

/** Regex to match the leading dice notation: NdM where N and M are positive integers. */
const DICE_REGEX = /^(\d+d\d+)/;

/** Set of valid special roll type shortcodes. */
const VALID_SPECIALS = new Set(['KH1', 'KL1', 'DL1', 'DH1']);

/**
 * Parsed dice expression result.
 *
 * @interface ParsedDiceExpression
 * @property {string} dice - Dice notation, e.g. "2d20", "3d6", "1d100"
 * @property {string[]} specials - Array of special roll types in order of appearance, e.g. ['KH1', 'DL1']
 * @property {string | null} modifier - Signed modifier string, e.g. "+5", "-3", or null if none
 * @property {string | null} damageType - Free-text damage type / description, or null if none
 */
export interface ParsedDiceExpression {
  dice: string;
  specials: string[];
  modifier: string | null;
  damageType: string | null;
}

/**
 * Extracts special roll shortcodes from a string, in order of first appearance.
 * Deduplicates so each shortcode appears at most once.
 *
 * @param {string} text - The text to scan for special shortcodes
 * @returns {string[]} Ordered unique list of found special shortcodes
 */
function extractSpecials(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const regex = new RegExp(SPECIAL_REGEX.source, 'g');
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
 * Normalizes whitespace in a modifier string by removing all spaces.
 *
 * @param {string} raw - The raw modifier match, e.g. "+ 5" or "-3"
 * @returns {string} Normalized modifier, e.g. "+5" or "-3"
 */
function normalizeModifier(raw: string): string {
  return raw.replace(/\s/g, '');
}

/**
 * Strips matched special shortcodes from the remainder text.
 *
 * @param {string} text - The text to strip specials from
 * @returns {string} Text with all special shortcodes removed
 */
function stripSpecials(text: string): string {
  return text.replace(SPECIAL_REGEX, '');
}

/**
 * Parses a dice expression from the inner content of a `[% ... %]` block.
 * Returns null for malformed or empty expressions (leaves them as plain text).
 *
 * @param {string} inner - The raw content between `[%` and `%]`, e.g. "2d20;KH1 + 5 fire"
 * @returns {ParsedDiceExpression | null} Parsed expression or null if malformed
 *
 * @example
 * parseDiceExpression('2d20 + 5 fire damage') // { dice: '2d20', specials: [], modifier: '+5', damageType: 'fire damage' }
 * parseDiceExpression('3d6;DL1 psychic')       // { dice: '3d6', specials: ['DL1'], modifier: null, damageType: 'psychic' }
 * parseDiceExpression('2d20;KH1;RR')           // null — RR is not a valid special
 * parseDiceExpression('abc')                   // null — no dice notation
 * parseDiceExpression('')                      // null — empty
 */
export function parseDiceExpression(
  inner: string,
): ParsedDiceExpression | null {
  const trimmed = inner.trim();

  if (!trimmed) {
    return null;
  }

  const diceMatch = trimmed.match(DICE_REGEX);
  if (!diceMatch) {
    return null;
  }

  const dice = diceMatch[1];
  let remainder = trimmed.slice(diceMatch[0].length).trim();

  const specials = extractSpecials(remainder);

  remainder = stripSpecials(remainder).trim();

  const modMatch = remainder.match(MODIFIER_REGEX);
  let modifier: string | null = null;
  if (modMatch) {
    modifier = normalizeModifier(modMatch[1]);
    remainder = remainder.slice(modMatch[0].length).trim();
  }

  const damageType = remainder || null;

  return {
    dice,
    specials,
    modifier,
    damageType,
  };
}
