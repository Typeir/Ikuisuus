/**
 * Library URL Expansion
 *
 * @fileoverview Expands a shorthand library link into a full route. Pure, with
 * no filesystem access, so the remark plugin stays safe to bundle for the
 * client and the link checker can share the same rule.
 *
 * @module lib/md/libraryUrl
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { SUPPORTED_LOCALES } from '@/lib/constants/locales';

/** Path segment every library route carries after the locale. */
const LIBRARY_SEGMENT = 'library';

/**
 * First segments that address the app rather than content, left untouched so a
 * link to a route outside the library survives expansion.
 */
const RESERVED_SEGMENTS = new Set([
  'api',
  'assets',
  'downloads',
  'fonts',
  'images',
  'static',
  '_next',
]);

/**
 * Whether a URL is root-relative rather than external, protocol-relative, or an
 * anchor on the current page.
 *
 * @param {string} url - Link target
 * @returns {boolean} True when the URL addresses a path on this site
 */
function isRootRelative(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

/**
 * Full route for a library link written in shorthand.
 *
 * Content addresses the library three ways, and all three resolve here:
 * `/en/library/rules/…` (already whole), `/library/rules/…` (locale dropped),
 * and `/rules/…` (locale and library dropped). Anything already carrying a
 * locale, addressing a reserved app path, or pointing off-site is returned
 * unchanged, so expansion never rewrites a link that already meant something.
 *
 * @param {string} url - Link target as authored
 * @param {string} locale - Locale of the document holding the link
 * @returns {string} Full route, or the original URL when nothing applies
 *
 * @example
 * expandLibraryUrl('/rules/steel-and-strife/conditions#prone', 'en');
 * // '/en/library/rules/steel-and-strife/conditions#prone'
 */
export function expandLibraryUrl(url: string, locale: string): string {
  if (!isRootRelative(url)) return url;

  const [first] = url.slice(1).split('/');
  if (!first) return url;

  const segment = first.split('#')[0].split('?')[0].toLowerCase();
  if (RESERVED_SEGMENTS.has(segment)) return url;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(segment)) return url;

  return segment === LIBRARY_SEGMENT
    ? `/${locale}${url}`
    : `/${locale}/${LIBRARY_SEGMENT}${url}`;
}
