/**
 * @fileoverview Search URL builder.
 * @description One place that turns a query and a set of aspect filters
 * into the `/search` URL, so the bar, the filter row and the suggestions
 * agree on the shape (`?q=…&aspect=group:value&aspect=…`).
 *
 * @module modules/search/domain/searchHref
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Builds the search page URL.
 *
 * @param {string} locale - Active locale
 * @param {string} query - Free-text query, may be empty
 * @param {string[]} aspects - Aspect filters, deduplicated in order
 * @returns {string} Absolute path with query string
 */
export function searchHref(
  locale: string,
  query: string,
  aspects: string[],
): string {
  const params = new URLSearchParams();
  const q = query.trim();
  if (q) params.set('q', q);
  for (const aspect of Array.from(new Set(aspects))) params.append('aspect', aspect);
  const qs = params.toString();
  return `/${locale}/search${qs ? `?${qs}` : ''}`;
}
