/**
 * @fileoverview search domain barrel
 * @module modules/search/domain
 * @description Re-exports the search domain contracts and content-type taxonomy.
 *
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

export {
    CONTENT_SUBDIR,
    CONTENT_TYPE_META,
    SEARCH_CONTENT_TYPES
} from './contentTypes';
export type { ContentTypeMeta, SearchContentType } from './contentTypes';
export type {
    SearchFacet,
    SearchFacetValue,
    SearchFilter,
    SearchQuery,
    SearchRecord,
    SearchResponse,
    SearchResult
} from './types';

