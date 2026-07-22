/**
 * @fileoverview Pagefind → SearchResult Mapper
 * @description Maps raw Pagefind result fragments into the domain
 * `SearchResult` shape (T3). Extracts the content type from filters,
 * preserves `<mark>` highlight tags in the snippet, and pulls display
 * metadata fields.
 *
 * @module modules/search/infrastructure/mapRecord
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
    SEARCH_CONTENT_TYPES,
    type SearchContentType,
    type SearchResult,
} from '../domain';
import type { PagefindFragment } from './pagefindClient';

/**
 * Maps a raw Pagefind result (post-`data()` resolution) into a domain
 * `SearchResult`. Extracts the content type from `filters.type[0]` and
 * maps `meta` fields to the flat result shape.
 *
 * @param {PagefindFragment} fragment - Resolved Pagefind fragment
 * @param {string} locale - Locale code for id construction
 * @returns {SearchResult} Typed search result
 */
export function mapPagefindResult(
  fragment: PagefindFragment,
  locale: string,
): SearchResult {
  const rawType = fragment.filters?.type?.[0] ?? '';
  const type: SearchContentType = (
    SEARCH_CONTENT_TYPES as unknown as string[]
  ).includes(rawType)
    ? (rawType as unknown as SearchContentType)
    : 'world';

  const slug = fragment.meta?.slug || fragment.url.split('/').pop() || '';

  let normalized = fragment.url.replace(/^\/+/, '');
  while (/^[a-z]{2}\//.test(normalized)) {
    normalized = normalized.slice(3);
  }
  const link = `/${locale}/${normalized}`;

  return {
    record: {
      id: `${type}:${locale}:${slug}`,
      type,
      locale,
      slug,
      title: fragment.meta?.title || slug,
      link,
      description: fragment.meta?.description,
      snippet: fragment.excerpt,
      tags: fragment.meta?.tags
        ? fragment.meta.tags.split(', ').filter(Boolean)
        : undefined,
      image: fragment.meta?.image,
      meta: fragment.meta
        ? Object.fromEntries(
            Object.entries(fragment.meta).filter(
              ([, v]) => v !== undefined && v !== '',
            ),
          )
        : undefined,
    },
    score: 0,
    snippet: fragment.excerpt,
    matchedFields: [],
  };
}
