/**
 * @fileoverview search module barrel
 * @module modules/search/index
 * @description Search over a build-time Pagefind full-prose index enriched with
 * structured metadata, for the sidebar SearchBar, the results page, and home-page
 * discovery (featured / of-the-day / random).
 *
 * Exports domain types, application hooks, and presentation components.
 * Infrastructure loaders and deep internal paths are not exported.
 *
 * Locale: v1 indexes `en` only; all layers are locale-parameterized. Never
 * hard-code `'en'` in shared logic.
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
    SearchRecord,
    SearchResponse,
    SearchResult
} from './domain';

export { useScopedSearch, useSearch, useSearchFacets } from './application';
export type { ScopedSearchOptions, ScopedSearchState } from './application';
export { ArchivistPanel, SearchField } from './presentation';
export type { SearchFieldProps } from './presentation';

