/**
 * @fileoverview search module barrel
 * @module modules/search/index
 * @description Search over a build-time Pagefind full-prose index enriched with
 * structured metadata, for the sidebar SearchBar
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
export {
    ArchivistPanel,
    AspectSuggestions,
    SearchField,
    useAspectAutocomplete
} from './presentation';
export type { PickedAspect, SearchFieldProps } from './presentation';

