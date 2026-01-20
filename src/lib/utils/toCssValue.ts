/**
 * @file toCss.ts
 * @description A utility function to convert values to CSS-compatible strings.
 *
 * @module toCss
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * @function toCssValue
 * @description Converts a string or number to a CSS-compatible value.
 * @param {string | number | undefined} v - The input value to convert.
 *
 * @returns {string | undefined} - The CSS-compatible value or undefined.
 *
 * @example
 * toCssValue(10); // returns "10px"
 * toCssValue("50%"); // returns "50%"
 * toCssValue(undefined); // returns undefined
 */
export const toCssValue = (
  v: string | number | undefined,
): string | undefined => {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
};
