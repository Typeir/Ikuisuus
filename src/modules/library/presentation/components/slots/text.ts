/**
 * @fileoverview Casing helpers shared by the card hosts.
 * @description Every card assembles a brief from slot values, and each one
 * needs the same two adjustments: a value that opens a sentence takes a
 * capital, a value that follows one loses it.
 *
 * @module modules/library/presentation/components/slots/text
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
