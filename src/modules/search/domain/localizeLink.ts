/**
 * @fileoverview Normalizes a content link to exactly one locale prefix.
 *
 * @module modules/search/domain/localizeLink
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/** Locale codes the app routes under (mirrors `src/i18n/routing.ts`). */
export const SUPPORTED_LOCALES = ['en', 'es', 'fi'] as const;

/** Matches a single leading locale segment (e.g. `/en/` or `/en`). */
const LEADING_LOCALE = new RegExp(`^/(?:${SUPPORTED_LOCALES.join('|')})(?=/|$)`);

/**
 * Normalizes a content link to carry exactly one locale prefix.
 *
 * Strips any existing leading locale segment(s), drops a trailing `#undefined`
 * anchor, and prepends the requested locale. Idempotent.
 *
 * @param {string} link - Raw link from a metadata sidecar or API payload
 * @param {string} locale - Target locale code (e.g. 'en')
 * @returns {string} Localized link (e.g. `/en/library/monsters/aboleth`)
 */
export function localizeLink(link: string, locale: string): string {
  let path = link.trim();
  if (!path.startsWith('/')) path = `/${path}`;

  while (LEADING_LOCALE.test(path)) {
    path = path.replace(LEADING_LOCALE, '') || '/';
  }

  path = path.replace(/#undefined$/, '');

  return `/${locale}${path}`;
}
