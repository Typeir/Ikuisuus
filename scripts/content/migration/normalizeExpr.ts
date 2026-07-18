/**
 * @fileoverview Dice expression normalization
 * @description Normalizes parsed dice components into the canonical
 * `[% NdM + static type %]` output form.
 *
 * @module scripts/content/migration/normalizeExpr
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Normalizes a dice expression into canonical `[% NdM + static type %]` form.
 * Dice notation always first, static modifier second, damage type last.
 * Strips trailing " damage" suffix from type string.
 *
 * @param {string} dice - Dice notation, e.g. "2d20"
 * @param {string | null} modifier - Signed numeric modifier or null
 * @param {string | null} type - Damage type description or null
 * @returns {string} Normalized expression: `[% dice + modifier type %]`
 */
export function normalizeExpr(
  dice: string,
  modifier: string | null,
  type: string | null,
): string {
  let inner = dice.trim();

  if (modifier !== null) {
    const cleaned = modifier.trim().replace(/\s+/g, '');
    const normalized =
      cleaned.startsWith('+') || cleaned.startsWith('-')
        ? cleaned
        : `+${cleaned}`;
    inner += ` ${normalized}`;
  }

  if (type !== null) {
    const cleaned = type
      .trim()
      .replace(/\s+damage$/i, '')
      .replace(/\.$/, '');
    if (cleaned) {
      inner += ` ${cleaned}`;
    }
  }

  return `[% ${inner} %]`;
}

/**
 * Normalizes whitespace in a dice modifier string.
 *
 * @param {string} raw - Raw modifier text, e.g. "+ 5"
 * @returns {string} Cleaned modifier, e.g. "+5"
 */
export function cleanMod(raw: string): string {
  return raw.replace(/\s+/g, '');
}

/**
 * Cleans a damage type string by removing trailing "damage" suffix and punctuation.
 *
 * @param {string} raw - Raw type text, e.g. "piercing damage."
 * @returns {string} Cleaned type, e.g. "piercing"
 */
export function cleanType(raw: string): string {
  return raw
    .trim()
    .replace(/\s+damage$/i, '')
    .replace(/[.,;]+$/, '')
    .trim();
}
