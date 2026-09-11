/**
 * @fileoverview Casing helpers shared by the card hosts.
 * @description Every card assembles a brief from slot values, and each one
 * needs the same two adjustments
 *
 * @module modules/library/presentation/components/slots/utils/text
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

/**
 * Upper-cases the first character.
 *
 * @param {string} text - Text
 * @returns {string} Text with a capital first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Lower-cases the first character.
 *
 * @param {string} text - Text
 * @returns {string} Text with a lower-case first letter
 */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Reads a slot written as a flag.
 *
 * @param {unknown} value - Slot value as MDX delivered it
 * @returns {boolean | unknown} `true` when the flag is set with nothing more to
 * say, `false` when absent or negated
 *
 * @example
 * flagOf(true); // true
 * flagOf('false'); // false
 * flagOf('once per tier'); // 'once per tier'
 */
export function flagOf(value: unknown): boolean | unknown {
  if (value === undefined || value === false) return false;
  if (value === true || value === null) return true;
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (text === '' || /^(?:true|yes)$/i.test(text)) return true;
  if (/^(?:false|no)$/i.test(text)) return false;
  return text;
}
