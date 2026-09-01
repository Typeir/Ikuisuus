/**
 * Locale Constants
 *
 * @fileoverview Single source of truth for the locale list, shared by routing,
 * search, scripts, and keyword resolution.
 *
 * @module lib/constants/locales
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/** Locale codes the app routes under. */
export const SUPPORTED_LOCALES = ['en'] as const;

/** One of the supported locale codes. */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Locale served when no locale matches. */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Whether a string is one of the supported locale codes.
 *
 * @param {string} value - Candidate locale code
 * @returns {value is SupportedLocale} True when the code is routable
 *
 * @example
 * isSupportedLocale('en'); // true
 */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Locale scanned when a caller names none. */
export const DEFAULT_KEYWORD_LOCALE: string = DEFAULT_LOCALE;
