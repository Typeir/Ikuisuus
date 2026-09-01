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
    localizeLink,
    SEARCH_CONTENT_TYPES,
    type SearchContentType,
    type SearchResult,
} from '../domain';
import type { PagefindFragment } from './pagefindClient';

/**
 * Slug of a resolved fragment: indexed meta first, then the URL tail.
 *
 * @param {PagefindFragment} fragment - Resolved Pagefind fragment
 * @returns {string} Record slug, empty when neither source carries one
 */
export function slugOfFragment(fragment: PagefindFragment): string {
  return fragment.meta?.slug || fragment.url.split('/').pop() || '';
}

/**
 * Maps a resolved Pagefind fragment into a domain `SearchResult`.
 * Content type comes from `filters.type[0]`; `meta` maps to the flat shape.
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

  const slug = slugOfFragment(fragment);

  const link = localizeLink(fragment.url.replace(/^\/+/, '/'), locale);

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
