/**
 * @fileoverview search module barrel
 * @module modules/search
 * @description Wiki page-indexed hybrid search ("The Archivist's Index"). Combines
 * a build-time Pagefind full-prose index with structured metadata enrichment to
 * power the always-visible sidebar SearchBar, the dedicated results page, and
 * home-page discovery (featured / of-the-day / random).
 *
 * Public API surfaces domain types, application hooks, and presentation
 * components. Infrastructure loaders and deep internal paths are not exported.
 *
 * Locale policy: v1 indexes `en` only, but every layer is locale-parameterized so
 * `es` and `fi` drop in with no refactor. Never hard-code `'en'` in shared logic.
 *
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

export { CONTENT_TYPE_META, SEARCH_CONTENT_TYPES } from './domain';
export type {
    ContentTypeMeta,
    SearchContentType,
    SearchFacet,
    SearchFacetValue,
    SearchFilter,
    SearchQuery,
    SearchRecord,
    SearchResponse,
    SearchResult
} from './domain';

export { toSearchQuery, useSearch, useSearchFacets } from './application';
export { ArchivistPanel } from './presentation';

